import produce from 'immer'
import { andThen, last, pipe } from 'ramda'
import { Battle, CaseType, Move, Result, TicTacToeAction, TicTacToeActionType, Turn } from './types'
import { applyAction, opposite, getResult } from './common'
import { getBattle, publishMessage, setBattle } from './store'
import { Redis } from 'ioredis'
import { concludeQueue } from './queues'
import { v4 } from 'uuid'
import redis from '../redis'
import logger from '../logger'
import { config } from './config'

export const playerWin = (battle: Battle) => {
  if (battle.result === Result.X_WIN) {
    return battle.externalPlayer === Turn.X
  }
  if (battle.result === Result.O_WIN) {
    return battle.externalPlayer === Turn.O
  }
  return false
}

interface ProcessMoveContext {
  redis: Redis
  battle: Battle
  input: {
    move: Move
  }
  output: {
    errors: string[]
    action?: TicTacToeAction
  }
}

export const validate = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, (draft) => {
  const move = draft.input.move
  const state = last(draft.battle.history)
  if (state === undefined) {
    draft.output.errors.push('Battle has no history')
  } else {
    if (move.action.type === TicTacToeActionType.PUT_SYMBOL) {
      // check in handlePutSymbol
    } else if (move.action.type === TicTacToeActionType.FLIP_TABLE) {
      if (!state.expectFlip) {
        draft.output.errors.push(`You are not supposed to flip the table now`)
      }
    } else if (move.action.type === TicTacToeActionType.START_GAME) {
      if (draft.battle.history.length !== 1) {
        draft.output.errors.push('game already started')
      }
    } else {
      draft.output.errors.push('unknown action type')
    }
    if (state.expectFlip && move.action.type !== TicTacToeActionType.FLIP_TABLE) {
      draft.output.errors.push('You should have flipped the table now')
    }
  }
  return draft
})
export const handlePutSymbol = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.move.action.type !== TicTacToeActionType.PUT_SYMBOL) return ctx
  if (ctx.output.errors.length > 0) return ctx
  return produce(ctx, draft => {
    const move = draft.input.move
    const state = last(draft.battle.history)
    if (state === undefined) {
      draft.output.errors.push('no history')
      return draft
    } else if (typeof (move.action.x) !== 'number' || typeof (move.action.y) !== 'number') {
      draft.output.errors.push('Expect x and y shall be number for put symbol action')
    } else {
      if (![0, 1, 2].includes(move.action.x) || ![0, 1, 2].includes(move.action.y)) {
        draft.output.errors.push(`location ${move.action.x},${move.action.y} is out of range`)
      } else if (state.board[move.action.y][move.action.x] !== null) {
        draft.output.errors.push(`location ${move.action.x},${move.action.y} is not empty`)
      }
    }
    if (state.turn !== move.by) {
      draft.output.errors.push('Not your turn')
    }
    if (draft.output.errors.length > 0) {
      return draft
    }
    const current = applyAction(state, move.action)
    draft.battle.history.push(current)
    return draft
  })
}
export const checkEndGame = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  if (ctx.input.move.action.type === TicTacToeActionType.FLIP_TABLE) {
    draft.battle.result = Result.FLIPPED
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
      || draft.battle.type === CaseType.C_AI_X_FIRST
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
    draft.battle.result = Result.FLIPPED
    draft.battle.flippedReason = draft.output.errors.join('\n')
    draft.battle.flippedBy = opposite(draft.battle.externalPlayer)
  } else if (draft.battle.result !== undefined) {
    draft.battle.score = config[draft.battle.type].score(draft.battle)
  }
  return draft
})
export const publishOutput = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> =>
  produce(ctx, async draft => {
    if (draft.output.errors.length > 0) {
      await setBattle(draft.redis, draft.battle)
      await publishMessage(draft.redis, draft.battle.id, {
        action: 'flipTable',
        player: opposite(draft.battle.externalPlayer)
      })
      return draft
    } else {
      await setBattle(draft.redis, draft.battle)
      if (draft.output.action) {
        await publishMessage(draft.redis, draft.battle.id, {
          player: opposite(draft.battle.externalPlayer),
          action: draft.output.action.type,
          x: draft.output.action.x,
          y: draft.output.action.y,
          action2: draft.output.action.action2 !== undefined ? {
            player: opposite(draft.battle.externalPlayer),
            action: draft.output.action.action2.type,
            x: draft.output.action.action2.x,
            y: draft.output.action.action2.y,
          } : undefined
        })
      }
      if (draft.battle.result !== undefined && draft.battle.result !== Result.FLIPPED) {
        const message: Record<string, unknown> = {}
        switch (draft.battle.result) {
          case Result.O_WIN:
            message.winner = 'O'
            break
          case Result.X_WIN:
            message.winner = 'X'
            break
          case Result.DRAW:
            message.winner = 'DRAW'
            break
        }
        await publishMessage(draft.redis, draft.battle.id, message)
      }
    }
  })
const addToScoreQueue = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> => {
  if (ctx.battle.result !== undefined) {
    await concludeQueue.add(v4(), { runId: ctx.battle.runId })
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
export const processMove = async (move: Move): Promise<unknown> => {
  const battle = await getBattle(redis, move.battleId)
  if (battle !== null) {
    if (battle.result === undefined) {
      const ctx: ProcessMoveContext = {
        redis,
        battle,
        input: { move },
        output: {
          errors: []
        }
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
