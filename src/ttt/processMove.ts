import produce from 'immer'
import { andThen, last, pipe } from 'ramda'
import {
  TicTacToeAction,
  TicTacToeActionType,
  TicTacToeBattle,
  TicTacToeCaseType,
  TicTacToeMove,
  TicTacToeResult,
  TicTacToeTurn
} from './types'
import { applyAction, externalizeAction, getResult, internalizeAction, opposite } from './common'
import { getBattle, publishMessage, setBattle, unlockBattle } from './store'
import { Redis } from 'ioredis'
import { ticTacToeConcludeQueue } from './queues'
import { v4 } from 'uuid'
import redis from '../common/redis'
import logger from '../common/logger'
import { config } from './config'

export const playerWin = (battle: TicTacToeBattle) => {
  if (battle.result === TicTacToeResult.X_WIN) {
    return battle.externalPlayer === TicTacToeTurn.X
  }
  if (battle.result === TicTacToeResult.O_WIN) {
    return battle.externalPlayer === TicTacToeTurn.O
  }
  return false
}

interface ProcessMoveContext {
  redis: Redis
  battle: TicTacToeBattle
  input: {
    action: TicTacToeAction
    by: TicTacToeTurn
  }
  output: {
    errors: string[]
    action?: TicTacToeAction
  }
}

export const validate = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, (draft) => {
  const action = draft.input.action
  if (ctx.battle.clock < 0) {
    draft.output.errors.push('You ran out of time')
  }
  if (draft.output.errors.length > 0) {
    return draft
  }
  const state = last(draft.battle.history)
  if (state === undefined) {
    draft.output.errors.push('Battle has no history')
  } else {
    if (action.type === TicTacToeActionType.INVALID_ACTION) {
      if (draft.output.errors.length === 0) {
        draft.output.errors.push('invalid action')
      }
    } else if (action.type === TicTacToeActionType.PUT_SYMBOL) {
      // check in handlePutSymbol
    } else if (action.type === TicTacToeActionType.FLIP_TABLE) {
      if (!state.expectFlip) {
        draft.output.errors.push(`You are not supposed to flip the table now`)
      }
    } else if (action.type === TicTacToeActionType.START_GAME) {
      if (draft.battle.history.length !== 1) {
        draft.output.errors.push('game already started')
      }
    } else {
      draft.output.errors.push('unknown action type')
    }
    if (state.expectFlip && action.type !== TicTacToeActionType.FLIP_TABLE) {
      draft.output.errors.push('You should have flipped the table now')
    }
  }
  return draft
})
export const handlePutSymbol = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.action.type !== TicTacToeActionType.PUT_SYMBOL) return ctx
  if (ctx.output.errors.length > 0) return ctx
  return produce(ctx, draft => {
    const action = draft.input.action
    const state = last(draft.battle.history)
    if (state === undefined) {
      draft.output.errors.push('no history')
      return draft
    } else if (typeof (action.x) !== 'number' || typeof (action.y) !== 'number') {
      draft.output.errors.push('Expect x and y shall be number for put symbol action')
    } else {
      if (![0, 1, 2].includes(action.x) || ![0, 1, 2].includes(action.y)) {
        draft.output.errors.push(`location ${action.x},${action.y} is out of range`)
      } else if (state.board[action.y][action.x] !== null) {
        draft.output.errors.push(`location ${action.x},${action.y} is not empty`)
      }
    }
    if (state.turn !== ctx.input.by) {
      draft.output.errors.push('Not your turn')
    }
    if (draft.output.errors.length > 0) {
      return draft
    }
    const current = applyAction(state, action)
    draft.battle.history.push(current)
    return draft
  })
}
export const checkEndGame = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  if (ctx.input.action.type === TicTacToeActionType.FLIP_TABLE) {
    draft.battle.result = TicTacToeResult.FLIPPED
    return draft
  } else {
    const state = last(draft.battle.history)
    if (state !== undefined) {
      const winner = getResult(state)
      if (winner) {
        draft.battle.result = winner
      }
    }
    return draft
  }
})
export const agentMove = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  const state = last(draft.battle.history)
  if (state !== undefined
    && (
      state.turn === opposite(draft.battle.externalPlayer)
      || draft.battle.type === TicTacToeCaseType.C_AI_X_FIRST
    )
    && draft.battle.result === undefined) {
    let action = config[draft.battle.type].agent(state)
    let expectFlip = false
    if ('cheat' in action) {
      action = action.cheat
      expectFlip = true
    }
    draft.battle.history.push({ ...applyAction(state, action), expectFlip })
    draft.output.action = action
    return draft
  }
  return draft
})
const calculateScore = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  if (draft.output.errors.length > 0) {
    draft.battle.score = 0
    draft.battle.result = TicTacToeResult.FLIPPED
    draft.battle.flippedReason = draft.output.errors.join('\n')
    draft.battle.flippedBy = opposite(draft.battle.externalPlayer)
  } else if (draft.battle.result !== undefined) {
    draft.battle.score = config[draft.battle.type].score(draft.battle)
  }
  return draft
})
export const publishOutput = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> =>
  produce(ctx, async draft => {
    await unlockBattle(redis, draft.battle.id)
    if (draft.output.errors.length > 0) {
      await setBattle(draft.redis, draft.battle)
      await publishMessage(draft.redis, draft.battle.id,
        externalizeAction(
          { type: TicTacToeActionType.FLIP_TABLE },
          opposite(draft.battle.externalPlayer)))
      return draft
    } else {
      await setBattle(draft.redis, draft.battle)
      if (draft.output.action) {
        await publishMessage(draft.redis, draft.battle.id,
          externalizeAction(draft.output.action, opposite(draft.battle.externalPlayer), {
            action2: draft.output.action.action2 !== undefined
              ? externalizeAction(
                draft.output.action.action2,
                opposite(draft.battle.externalPlayer))
              : undefined
          })
        )
      }
      if (draft.battle.result !== undefined && draft.battle.result !== TicTacToeResult.FLIPPED) {
        const message: Record<string, unknown> = {}
        switch (draft.battle.result) {
          case TicTacToeResult.O_WIN:
            message.winner = 'O'
            break
          case TicTacToeResult.X_WIN:
            message.winner = 'X'
            break
          case TicTacToeResult.DRAW:
            message.winner = 'DRAW'
            break
        }
        await publishMessage(draft.redis, draft.battle.id, message)
      }
    }
  })
const addToScoreQueue = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> => {
  if (ctx.battle.result !== undefined) {
    await ticTacToeConcludeQueue.add(v4(), { runId: ctx.battle.runId })
  }
  return ctx
}
const handleError = (e: Error) => (ctx: ProcessMoveContext): ProcessMoveContext => {
  return produce(ctx, draft => {
    draft.battle.flippedBy = opposite(draft.battle.externalPlayer)
    draft.battle.flippedReason = 'internal error: ' + e.message
    draft.battle.score = 0
    return draft
  })
}
export const processMove = async (move: TicTacToeMove): Promise<unknown> => {
  const battle = await getBattle(redis, move.battleId)
  if (battle !== null) {
    if (battle.result === undefined) {
      let action = { type: TicTacToeActionType.INVALID_ACTION }, error = move.error
      try {
        action = internalizeAction(move.action)
      } catch (e) {
        error = e.message
      }
      const ctx: ProcessMoveContext = {
        redis,
        battle,
        input: { action, by: move.by },
        output: {
          errors: []
        }
      }
      if (error !== undefined) {
        ctx.output.errors.push(error)
      }
      try {
        const { battle: battleNew, input, output } = await pipe(
          validate,
          handlePutSymbol,
          checkEndGame,
          agentMove,
          checkEndGame,
          calculateScore,
          publishOutput,
          andThen(addToScoreQueue)
        )(ctx)
        return { battle: battleNew, input, output }
      } catch (e) {
        logger.err(e)
        // store the score to redis and call for score aggregation
        await pipe(
          handleError(e as unknown as Error),
          publishOutput,
          andThen(addToScoreQueue)
        )(ctx)
        throw e
      }
    } else {
      return `battle ${move.battleId} has result ${battle.result}`
    }
  } else {
    return `battle ${move.battleId} does not exist`
  }
}
