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
import {
  applyAction,
  canPutWall,
  compressState,
  depressState,
  externalizeAction,
  getResult,
  getWalkableNeighborCoords,
  internalizeAction,
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

export const playerWin = (battle: QuoridorBattle) => {
  if (battle.result === QuoridorResult.FIRST_WIN) {
    return battle.externalPlayer === QuoridorTurn.FIRST
  }
  if (battle.result === QuoridorResult.SECOND_WIN) {
    return battle.externalPlayer === QuoridorTurn.SECOND
  }
  return false
}

interface ProcessMoveContext {
  redis: Redis
  battle: QuoridorBattle
  input: {
    action: QuoridorAction
    by: QuoridorTurn
  }
  output: {
    errors: string[]
    action?: QuoridorAction
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
    if ([QuoridorActionType.MOVE, QuoridorActionType.PUT_WALL].includes(action.type)) {
      // check in handlePutSymbol or handlePutWall
    } else if (action.type === QuoridorActionType.FLIP_TABLE) {
      if (!state.expectFlip) {
        draft.output.errors.push(`You are not supposed to flip the table now`)
      }
    } else if (action.type === QuoridorActionType.START_GAME) {
      if (draft.battle.history.length !== 1) {
        draft.output.errors.push('game already started')
      }
    } else {
      draft.output.errors.push('unknown action type')
    }
    if (state.expectFlip && action.type !== QuoridorActionType.FLIP_TABLE) {
      draft.output.errors.push('You should have flipped the table now')
    }
  }
  return draft
})
export const checkEndGame = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  if (ctx.input.action.type === QuoridorActionType.FLIP_TABLE) {
    draft.battle.result = QuoridorResult.FLIPPED
    return draft
  } else {
    const state = depressState(last(draft.battle.history))
    if (state !== undefined) {
      const winner = getResult(state)
      if (winner) {
        draft.battle.result = winner
      }
    }
    if (Math.floor(draft.battle.history.length / 2) >= TERMINATE_TURNS) {
      draft.battle.result = QuoridorResult.DRAW
    }
    return draft
  }
})
export const agentMove = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  const state = depressState(last(draft.battle.history))
  if (state !== undefined
    && (
      state.turn === opposite(draft.battle.externalPlayer)
      || draft.battle.type === QuoridorCaseType.C_AI_SECOND_FIRST
    )
    && draft.battle.result === undefined) {
    let action = config[draft.battle.type].agent(state)
    let expectFlip = false
    if ('cheat' in action) {
      action = action.cheat
      expectFlip = true
    }
    draft.battle.history.push(compressState({ ...applyAction(state, action), expectFlip }))
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
    await unlockBattle(redis, draft.battle.id)
    if (draft.output.errors.length > 0) {
      await setBattle(draft.redis, draft.battle)
      await publishMessage(draft.redis, draft.battle.id, {
        action: QuoridorActionType.FLIP_TABLE,
        player: opposite(draft.battle.externalPlayer)
      })
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
          }))
      }
      if (draft.battle.result !== undefined && draft.battle.result !== QuoridorResult.FLIPPED) {
        const message: Record<string, unknown> = {}
        switch (draft.battle.result) {
          case QuoridorResult.SECOND_WIN:
            message.winner = 'SECOND'
            break
          case QuoridorResult.FIRST_WIN:
            message.winner = 'FIRST'
            break
          case QuoridorResult.DRAW:
            message.winner = 'DRAW'
            break
          default:
            message.winner = 'UNKNOWN'
            break
        }
        await publishMessage(draft.redis, draft.battle.id, message)
      }
    }
  })
const addToScoreQueue = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> => {
  if (ctx.battle.result !== undefined) {
    await getConcludeQueue().add(v4(), {
      game: Game.QUORIDOR, conclude: { runId: ctx.battle.runId }
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
export const handleMovePawn = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.action.type !== QuoridorActionType.MOVE) return ctx
  if (ctx.output.errors.length > 0) return ctx
  return produce(ctx, draft => {
    const action = draft.input.action
    const state = depressState(last(draft.battle.history))
    const x1 = action.x
    const y1 = action.y
    if (state === undefined) {
      draft.output.errors.push('no history')
      return draft
    } else {
      if (typeof x1 !== 'number' || typeof y1 !== 'number') {
        draft.output.errors.push('Expect x and y shall be number for action action')
        return draft
      } else {
        const neighbors = getWalkableNeighborCoords(state, state.turn)
        if (neighbors.find(({ x, y }) => x === x1 && y === y1) === undefined) {
          draft.output.errors.push(
            `Cannot move to ${externalizeAction(action).position ?? 'undefined'}`
          )
        }
      }
    }
    if (state.turn !== ctx.input.by) {
      draft.output.errors.push('Not your turn')
    }
    if (draft.output.errors.length > 0) {
      return draft
    }
    const current = applyAction(state, { type: action.type, x: x1, y: y1 })
    draft.battle.history.push(compressState(current))
    return draft
  })
}

export const handlePutWall = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.action.type !== QuoridorActionType.PUT_WALL) return ctx
  if (ctx.output.errors.length > 0) return ctx
  return produce(ctx, draft => {
    const action = draft.input.action
    const state = depressState(last(draft.battle.history))
    const x1 = action.x
    const y1 = action.y
    const o = action.o
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
          const s = externalizeAction(action).position?.substr(0, 2) ?? 'undefined'
          draft.output.errors.push(`Cannot put ${o} wall at ${s}`)
        }
      }
    }
    if (state.turn !== ctx.input.by) {
      draft.output.errors.push('Not your turn')
    }
    if (draft.output.errors.length > 0) {
      return draft
    }
    const current = applyAction(state, { type: action.type, x: x1, y: y1, o })
    draft.battle.history.push(compressState(current))
    return draft
  })
}

export const processMove = async (move: QuoridorMove): Promise<unknown> => {
  const battle = await getBattle(redis, move.battleId)
  if (battle !== null) {
    battle.moves.push(move.id)
    if (battle.result === undefined) {
      let action = { type: QuoridorActionType.INVALID_ACTION }, error = move.error
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
        const { input, output } = await pipe(
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
