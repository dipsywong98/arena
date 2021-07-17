import {
  AppContext,
  CaseType,
  flip,
  Move,
  TestCase,
  TicTacToeAction,
  TicTacToeActionType,
  TicTacToeState,
  Turn
} from './common'
import abAgent, { baseAgent } from './agent'
import { getBattle, publishMove, setBattle } from './store'
import { v4 } from 'uuid'
import { makeRedis } from '../redis'
import produce from 'immer'

const makeInitialStateGenerator = (aiTurn: Turn) => (): TicTacToeState => ({
  externalPlayer: flip(aiTurn),
  turn: aiTurn,
  board: [[null, null, null], [null, null, null], [null, null, null]],
  expectFlip: false,
  createdAt: Date.now()
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
      history: [initialStateGenerator()],
      id,
      type: type as CaseType,
      gradeId
    })
    return id
  }))
}

export const applyAction = (state: TicTacToeState, action: TicTacToeAction): TicTacToeState => {
  if (action.action === TicTacToeActionType.PUT_SYMBOL) {
    return produce(state, draft => {
      draft.board[action.y!][action.x!] = state.turn
      draft.turn = flip(state.turn)
    })
  }
  return state
}

export const processMove = async (move: Move) => {
  const redis = makeRedis()
  const {battleId, action} = move
  const battle = await getBattle(redis, battleId)
  const prevState = battle.history[battle.history.length - 1]
  // validate(state, move)
  const currState = applyAction(prevState, action)
  const ourAction = config[battle.type].agent(currState)
  const nextState = applyAction(currState, ourAction)
  battle.history.push(currState, nextState)
  await setBattle(redis, battle)
  await publishMove(redis, battleId, {id: v4(), battleId, action: ourAction})
  return ourAction
}
