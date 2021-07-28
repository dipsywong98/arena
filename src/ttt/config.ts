import { flip } from './common'
import abAgent, { baseAgent } from './agent'
import { setBattle } from './store'
import { v4 } from 'uuid'
import {
  AppContext,
  Battle,
  CaseType,
  Result,
  TestCase,
  TicTacToeAction,
  TicTacToeState,
  Turn
} from './types'
import { playerWin } from './handleMove'

const makeInitialStateGenerator = (aiTurn: Turn) =>
  (battleId: string, runId: string): Omit<Battle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: flip(aiTurn),
    history: [{
      expectFlip: false,
      turn: Turn.O,
      board: [[null, null, null], [null, null, null], [null, null, null]],
      createdAt: Date.now()
    }]
  })

export const config: Record<CaseType, TestCase> = Object.freeze({
  [CaseType.BASE_AI_O]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.O),
    agent (state: TicTacToeState): TicTacToeAction {
      return baseAgent(state)
    },
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.BASE_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return baseAgent(state)
    },
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.AB_AI_O]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.O),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: (battle) => {
      return (playerWin(battle) || battle.result === Result.DRAW) ? 3 : 0
    }
  },
  [CaseType.AB_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: (battle) => {
      return (playerWin(battle) || battle.result === Result.DRAW) ? 3 : 0
    }
  },
  [CaseType.C_AI_OUT_OF_BOUND]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: () => {
      return 1
    }
  },
  [CaseType.C_AI_DUP]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: () => {
      return 1
    }
  },
  [CaseType.C_AI_X_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: () => {
      return 1
    }
  },
  [CaseType.C_AI_TWICE_A_ROW]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state: TicTacToeState): TicTacToeAction {
      return abAgent(state)
    },
    score: () => {
      return 1
    }
  }
})

export const generateBattlesForGrading = async (
  appContext: AppContext,
  runId: string,
  type?: CaseType
): Promise<string[]> => {
  return Promise.all(
    Object.entries(type !== undefined ? { [type]: config[type] } : config)
      .map(async ([type, { initialStateGenerator }]) => {
        const id = v4()
        await setBattle(appContext.pubRedis, {
          ...initialStateGenerator(id, runId),
          type: type as CaseType
        })
        return id
      }))
}

// TODO ensure handle move only if started
// TODO handle the endgame result
// TODO refactor to make move payload and event payload consistent
// TODO shuffle the generated battle ids
// TODO time limit for submitting next move
// TODO linter
// TODO testing
