import produce from 'immer'
import { andThen, last, pipe } from 'ramda'
import {
  Orientation,
  QuoridorAction,
  QuoridorActionType,
  QuoridorBattle,
  QuoridorCaseType,
  QuoridorMove,
  QuoridorResult,
  QuoridorTurn
} from './types'
import { applyAction, canPutWall, getResult, getWalkableNeighborCoords, opposite } from './common'
import { getBattle, publishMessage, setBattle } from './store'
import { Redis } from 'ioredis'
import { quoridorConcludeQueue } from './queues'
import { v4 } from 'uuid'
import redis from '../common/redis'
import logger from '../common/logger'
import { config } from './config'

export const playerWin = (battle: QuoridorBattle) => {
  if (battle.result === QuoridorResult.BLACK_WIN) {
    return battle.externalPlayer === QuoridorTurn.BLACK
  }
  if (battle.result === QuoridorResult.WHITE_WIN) {
    return battle.externalPlayer === QuoridorTurn.WHITE
  }
  return false
}

interface ProcessMoveContext {
  redis: Redis
  battle: QuoridorBattle
  input: {
    move: QuoridorMove
  }
  output: {
    errors: string[]
    action?: QuoridorAction
  }
}

export const validate = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, (draft) => {
  const move = draft.input.move
  if (ctx.battle.clock < 0) {
    draft.output.errors.push('You ran out of time')
  }
  const state = last(draft.battle.history)
  if (state === undefined) {
    draft.output.errors.push('Battle has no history')
  } else {
    if ([QuoridorActionType.MOVE, QuoridorActionType.PUT_WALL].includes(move.action.type)) {
      // check in handlePutSymbol or handlePutWall
    } else if (move.action.type === QuoridorActionType.FLIP_TABLE) {
      if (!state.expectFlip) {
        draft.output.errors.push(`You are not supposed to flip the table now`)
      }
    } else if (move.action.type === QuoridorActionType.START_GAME) {
      if (draft.battle.history.length !== 1) {
        draft.output.errors.push('game already started')
      }
    } else {
      draft.output.errors.push('unknown action type')
    }
    if (state.expectFlip && move.action.type !== QuoridorActionType.FLIP_TABLE) {
      draft.output.errors.push('You should have flipped the table now')
    }
  }
  return draft
})
export const checkEndGame = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  if (ctx.input.move.action.type === QuoridorActionType.FLIP_TABLE) {
    draft.battle.result = QuoridorResult.FLIPPED
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
      || draft.battle.type === QuoridorCaseType.C_AI_WHITE_FIRST
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
    draft.battle.result = QuoridorResult.FLIPPED
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
          o: draft.output.action.o,
          action2: draft.output.action.action2 !== undefined ? {
            player: opposite(draft.battle.externalPlayer),
            action: draft.output.action.action2.type,
            x: draft.output.action.action2.x,
            y: draft.output.action.action2.y,
            o: draft.output.action.o
          } : undefined
        })
      }
      if (draft.battle.result !== undefined && draft.battle.result !== QuoridorResult.FLIPPED) {
        const message: Record<string, unknown> = {}
        switch (draft.battle.result) {
          case QuoridorResult.WHITE_WIN:
            message.winner = 'WHITE'
            break
          case QuoridorResult.BLACK_WIN:
            message.winner = 'BLACK'
            break
        }
        await publishMessage(draft.redis, draft.battle.id, message)
      }
    }
  })
const addToScoreQueue = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> => {
  if (ctx.battle.result !== undefined) {
    await quoridorConcludeQueue.add(v4(), { runId: ctx.battle.runId })
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
export const handleMovePawn = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.move.action.type !== QuoridorActionType.MOVE) return ctx
  if (ctx.output.errors.length > 0) return ctx
  return produce(ctx, draft => {
    const move = draft.input.move
    const state = last(draft.battle.history)
    const x1 = move.action.x
    const y1 = move.action.y
    if (state === undefined) {
      draft.output.errors.push('no history')
      return draft
    } else {
      if (typeof x1 !== 'number' || typeof y1 !== 'number') {
        draft.output.errors.push('Expect x and y shall be number for move action')
        return draft
      } else {
        const neighbors = getWalkableNeighborCoords(state, state.turn)
        if (neighbors.find(({ x, y }) => x === x1 && y === y1) === undefined) {
          draft.output.errors.push(`Cannot move to ${x1},${y1}`)
        }
      }
    }
    if (state.turn !== move.by) {
      draft.output.errors.push('Not your turn')
    }
    if (draft.output.errors.length > 0) {
      return draft
    }
    const current = applyAction(state, { type: move.action.type, x: x1, y: y1 })
    draft.battle.history.push(current)
    return draft
  })
}

export const handlePutWall = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.move.action.type !== QuoridorActionType.PUT_WALL) return ctx
  if (ctx.output.errors.length > 0) return ctx
  return produce(ctx, draft => {
    const move = draft.input.move
    const state = last(draft.battle.history)
    const x1 = move.action.x
    const y1 = move.action.y
    const o = move.action.o
    if (state === undefined) {
      draft.output.errors.push('no history')
      return draft
    } else {
      if (typeof x1 !== 'number'
        || typeof y1 !== 'number'
        || o === undefined
        || ![Orientation.VERTICAL, Orientation.HORIZONTAL].includes(o)) {
        draft.output.errors.push(
          'Expect x and y shall be number, o shall be | or - for put wall action'
        )
        return draft
      } else {
        if (!canPutWall(state, x1, y1, o)) {
          draft.output.errors.push(`Cannot put ${o} wall at ${x1},${y1}`)
        }
      }
    }
    if (state.turn !== move.by) {
      draft.output.errors.push('Not your turn')
    }
    if (draft.output.errors.length > 0) {
      return draft
    }
    const current = applyAction(state, { type: move.action.type, x: x1, y: y1 })
    draft.battle.history.push(current)
    return draft
  })
}

export const processMove = async (move: QuoridorMove): Promise<unknown> => {
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
          handleMovePawn,
          handlePutWall,
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
