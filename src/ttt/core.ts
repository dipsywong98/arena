import {
  AppContext,
  Battle,
  CaseType,
  flip,
  getWinner,
  Move,
  Result,
  TestCase,
  TicTacToeAction,
  TicTacToeActionType,
  TicTacToeState,
  Turn
} from './common'
import abAgent, { baseAgent } from './agent'
import { getBattle, publishMessage, publishOutgoingMove, setBattle } from './store'
import { v4 } from 'uuid'
import { makeRedis } from '../redis'
import produce from 'immer'
import { Redis } from 'ioredis'
import { last, pipe } from 'ramda'

const makeInitialStateGenerator = (aiTurn: Turn) => (battleId: string, gradeId: string): Omit<Battle, 'type'> => ({
  id: battleId,
  gradeId,
  externalPlayer: flip(aiTurn),
  history: [{
    expectFlip: false,
    turn: Turn.O,
    board: [[null, null, null], [null, null, null], [null, null, null]],
    createdAt: Date.now()
  }]
})

const config: Record<CaseType, TestCase> = {
  [CaseType.BASE_AI_O]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.O),
    agent (state: TicTacToeState): TicTacToeAction {
      return baseAgent(state)
    },
    score: 3
  },
  [CaseType.BASE_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return baseAgent(state)
    },
    score: 3
  },
  [CaseType.AB_AI_O]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.O),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: 3
  },
  [CaseType.AB_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: 3
  },
  [CaseType.C_AI_OUT_OF_BOUND]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: 3
  },
  [CaseType.C_AI_DUP]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: 3
  },
  [CaseType.C_AI_X_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: 3
  },
  [CaseType.C_AI_TWICE_A_ROW]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: 3
  }
}

export const generateBattlesForGrading = async (appContext: AppContext, gradeId: string): Promise<string[]> => {
  return Promise.all(Object.entries(config).map(async ([type, { initialStateGenerator }]) => {
    const id = v4()
    await setBattle(appContext.pubRedis, {
      ...initialStateGenerator(id, gradeId),
      type: type as CaseType
    })
    return id
  }))
}

export const applyAction = (state: TicTacToeState, action: TicTacToeAction): TicTacToeState => {
  if (action.type === TicTacToeActionType.PUT_SYMBOL) {
    return produce(state, draft => {
      draft.board[action.y!][action.x!] = state.turn
      draft.turn = flip(state.turn)
    })
  }
  return state
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
  const state = last(draft.battle.history)!
  if (move.action.type === TicTacToeActionType.PUT_SYMBOL) {

  } else if (move.action.type === TicTacToeActionType.FLIP_TABLE) {
    if (!state.expectFlip) {
      draft.output.errors.push(`You are not supposed to flip the table now`)
    }
    if (state.turn !== move.by) {
      draft.output.errors.push('Not your turn')
    }
  } else if (move.action.type === TicTacToeActionType.START_GAME) {
    if (draft.battle.history.length !== 1) {
      draft.output.errors.push('game already started')
    }
  } else {
    draft.output.errors.push('unknown action type')
  }
  return draft
})

export const handlePutSymbol = (ctx: ProcessMoveContext): ProcessMoveContext => {
  if (ctx.input.move.action.type !== TicTacToeActionType.PUT_SYMBOL) return ctx
  return produce(ctx, draft => {
    const move = draft.input.move
    const state = last(draft.battle.history)!
    if (typeof (move.action.x) !== 'number' || typeof (move.action.y) !== 'number') {
      draft.output.errors.push('Expect x and y shall be number for put symbol action')
    } else {
      if (move.action.x < 0 || move.action.y < 0 || move.action.x > 2 || move.action.y > 2) {
        draft.output.errors.push(`location ${move.action.x},${move.action.y} is out of range`)
      }
      if (state.board[move.action.y][move.action.x] !== null) {
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
    const state = last(draft.battle.history)!
    const winner = getWinner(state)
    if (winner) {
      draft.battle.result = winner
    }
    return draft
  }
})

export const agentMove = (ctx: ProcessMoveContext): ProcessMoveContext => produce(ctx, draft => {
  const state = last(draft.battle.history)!
  if (state.turn === flip(draft.battle.externalPlayer) && draft.battle.result === undefined) {
    draft.output.action = config[draft.battle.type].agent(state)
    draft.battle.history.push(applyAction(state, draft.output.action))
    return draft
  }
  return draft
})

export const publishOutput = async (ctx: ProcessMoveContext): Promise<ProcessMoveContext> => produce(ctx, async draft => {
  if (draft.output.errors.length > 0) {
    const battle = {
      ...draft.battle,
      result: Result.FLIPPED,
      flippedReason: draft.output.errors.join('\n'),
      flippedBy: flip(draft.battle.externalPlayer)
    }
    await setBattle(draft.redis, battle)
    draft.battle = battle
    const action = {
      type: TicTacToeActionType.FLIP_TABLE
    }
    await publishOutgoingMove(draft.redis, {
      id: v4(),
      battleId: draft.battle.id,
      action,
      by: flip(draft.battle.externalPlayer)
    })
    return draft
  } else {
    await setBattle(draft.redis, draft.battle)
    if (draft.output.action) {
      await publishOutgoingMove(draft.redis, {
        id: v4(),
        battleId: draft.battle.id,
        action: draft.output.action,
        by: flip(draft.battle.externalPlayer)
      })
    }
    if (draft.battle.result !== undefined) {
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

export const processMove = async (move: Move): Promise<unknown> => {
  const redis = makeRedis()
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
      const { redis: _, ...rest } = await pipe(
        validate,
        handlePutSymbol,
        checkEndGame,
        agentMove,
        checkEndGame,
        publishOutput
      )(ctx)
      console.log(rest)
      return rest
    } else {
      return `battle ${move.battleId} has result ${battle.result}`
    }
  } else {
    return `battle ${move.battleId} does not exist`
  }
}

// TODO make flip table reason inside history
// TODO validate battle state before apply, aka whether started game and whether flipped table
// TODO shuffle the generated battle ids
// TODO time limit for submitting next move
// TODO linter
// TODO testing
