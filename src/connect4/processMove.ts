import produce from 'immer'
import { andThen, last, pipe } from 'ramda'
import {
  Connect4Action,
  Connect4ActionType,
  Connect4Battle,
  Connect4CaseType,
  Connect4Move,
  Connect4Result,
  COLUMNS,
  Connect4Turn
} from './types'
import {
  applyAction,
  externalizeAction,
  getResult,
  internalizeAction,
  isColumnFull,
  opposite
} from './common'
import { getBattle, publishMessage, setBattle, unlockBattle } from './store'
import { Redis } from 'ioredis'
import { v4 } from 'uuid'
import redis from '../common/redis'
import logger from '../common/logger'
import { config, TERMINATE_TURNS } from './config'
import { getConcludeQueue } from '../common/queues'
import { Game } from '../common/types'

export const playerWin = (battle: Connect4Battle) => {
  if (battle.result === Connect4Result.RED_WIN) {
    return battle.externalPlayer === Connect4Turn.RED
  }
  if (battle.result === Connect4Result.YELLOW_WIN) {
    return battle.externalPlayer === Connect4Turn.YELLOW
  }
  return false
}

interface ProcessMoveContext {
  redis: Redis
  battle: Connect4Battle
  input: {
    action: Connect4Action
    by: Connect4Turn
  }
  output: {
    errors: string[]
    action?: Connect4Action
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
    if (action.type === Connect4ActionType.INVALID_ACTION) {
      if (draft.output.errors.length === 0) {
        draft.output.errors.push('invalid action')
      }
    } else if (action.type === Connect4ActionType.PUT_TOKEN) {
      // check in handlePutSymbol
    } else if (action.type === Connect4ActionType.FLIP_TABLE) {
      if (!state.expectFlip) {
        draft.output.errors.push(`You are not supposed to flip the table now`)
      }
    } else if (action.type === Connect4ActionType.START_GAME) {
      if (draft.battle.history.length !== 1) {
        draft.output.errors.push('game already started')
      }
    } else {
      draft.output.errors.push('unknown action type')
    }
    if (state.expectFlip && action.type !== Connect4ActionType.FLIP_TABLE) {
      draft.output.errors.push('You should have flipped the table now')
    }
  }
  return draft
})
export const handlePutToken = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.action.type !== Connect4ActionType.PUT_TOKEN) return ctx
  if (ctx.output.errors.length > 0) return ctx
  return produce(ctx, draft => {
    const action = draft.input.action
    const state = last(draft.battle.history)
    if (state === undefined) {
      draft.output.errors.push('no history')
      return draft
    } else if (action.column === undefined) {
      draft.output.errors.push(`Expect column to be provided for PUT_SYMBOL action`)
    } else if (isColumnFull(state, action.column)) {
      draft.output.errors.push(`Column ${COLUMNS[action.column]} is full`)
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
  if (ctx.input.action.type === Connect4ActionType.FLIP_TABLE) {
    draft.battle.result = Connect4Result.FLIPPED
    return draft
  } else {
    const state = last(draft.battle.history)
    if (state !== undefined) {
      const winner = getResult(state)
      if (winner) {
        draft.battle.result = winner
      }
    }
    if (Math.floor(draft.battle.history.length / 2) >= TERMINATE_TURNS) {
      draft.battle.result = Connect4Result.DRAW
    }
    return draft
  }
})
export const agentMove = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  const state = last(draft.battle.history)
  if (state !== undefined
    && (
      state.turn === opposite(draft.battle.externalPlayer)
      || draft.battle.type === Connect4CaseType.C_AI_Y_FIRST
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
    draft.battle.result = Connect4Result.FLIPPED
    draft.battle.flippedReason = draft.output.errors.join('\n')
    draft.battle.flippedBy = opposite(draft.battle.externalPlayer)
    draft.battle.completedAt = Date.now()
  } else if (draft.battle.result !== undefined) {
    draft.battle.score = config[draft.battle.type].score(draft.battle)
    draft.battle.completedAt = Date.now()
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
          { type: Connect4ActionType.FLIP_TABLE },
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
      if (draft.battle.result !== undefined && draft.battle.result !== Connect4Result.FLIPPED) {
        const message: Record<string, unknown> = {}
        switch (draft.battle.result) {
          case Connect4Result.RED_WIN:
            message.winner = Connect4Turn.RED
            break
          case Connect4Result.YELLOW_WIN:
            message.winner = Connect4Turn.YELLOW
            break
          case Connect4Result.DRAW:
            message.winner = 'DRAW'
            break
        }
        await publishMessage(draft.redis, draft.battle.id, message)
      }
    }
  })
const addToScoreQueue = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> => {
  if (ctx.battle.result !== undefined) {
    await getConcludeQueue().add(v4(), {
      game: Game.CONNECT4, conclude: { runId: ctx.battle.runId }
    })
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
export const processMove = async (move: Connect4Move): Promise<unknown> => {
  const battle = await getBattle(redis, move.battleId)
  if (battle !== null) {
    battle.moves.push(move.id)
    if (battle.result === undefined) {
      let action = { type: Connect4ActionType.INVALID_ACTION }, error = move.error
      try {
        action = internalizeAction(move.action)
      } catch (e: any) {
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
        const { input, output } = await pipe(
          validate,
          handlePutToken,
          checkEndGame,
          agentMove,
          checkEndGame,
          calculateScore,
          publishOutput,
          andThen(addToScoreQueue)
        )(ctx)
        return { input, output }
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
