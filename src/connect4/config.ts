import { HEIGHT, opposite, WIDTH } from './common'
import abAgent, { baseAgent } from './agent'
import {
  Connect4ActionType,
  Connect4Battle,
  Connect4CaseType,
  Connect4Result,
  Connect4TestCase,
  Connect4State,
  Connect4Turn,
} from './types'
import { playerWin } from './processMove'
import { appConfig } from 'src/common/config'

export const INITIAL_CLOCK_MS = 18 * 1000

export const initState = (): Connect4State => {
  return {
    expectFlip: false,
    turn: Connect4Turn.RED,
    board: new Array(HEIGHT).fill(null).map(() => (
      new Array(WIDTH).fill(null) as (Connect4Turn | null)[]
    )),
    createdAt: Date.now(),
    moves: ''
  }
}

const makeInitialStateGenerator = (aiTurn: Connect4Turn) =>
  (battleId: string, runId: string): Omit<Connect4Battle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: opposite(aiTurn),
    history: [initState()],
    moves: [],
    clock: INITIAL_CLOCK_MS,
    createdAt: Date.now()
  })

export const TURN_ADD_MS = 2 * 1000

// would directly call the score function for score
export const TERMINATE_TURNS = appConfig.CONNECT4_TERMINATE_TURNS

export const config: Record<Connect4CaseType, Connect4TestCase> = Object.freeze({
  [Connect4CaseType.BASE_AI_R]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.RED),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 10 : 0
    }
  },
  [Connect4CaseType.BASE_AI_Y]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.YELLOW),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 10 : 0
    }
  },
  [Connect4CaseType.AB_AI_R]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.RED),
    agent: abAgent,
    score: (battle) => {
      return playerWin(battle) ? 15 : 0
    }
  },
  [Connect4CaseType.AB_AI_Y]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.YELLOW),
    agent: abAgent,
    score: (battle) => {
      return playerWin(battle) ? 15 : 0
    }
  },
  [Connect4CaseType.C_AI_OUT_OF_BOUND]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.YELLOW),
    agent() {
      return {
        cheat: {
          type: Connect4ActionType.PUT_TOKEN, column: 'H' as unknown as number
        }
      }
    },
    score: () => {
      return 3
    }
  },
  [Connect4CaseType.C_AI_OVERFLOW]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.RED),
    agent(state) {
      if (state.board[0][3] === null) {
        return {
          type: Connect4ActionType.PUT_TOKEN, column: 3
        }
      }
      return {
        cheat: {
          type: Connect4ActionType.PUT_TOKEN, column: 3
        }
      }
    },
    score: () => {
      return 10
    }
  },
  [Connect4CaseType.C_AI_Y_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.YELLOW),
    agent: () => {
      return {
        cheat: {
          type: Connect4ActionType.PUT_TOKEN, column: 3
        }
      }
    },
    score: () => {
      return 10
    }
  },
  [Connect4CaseType.C_AI_TWICE_A_ROW]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.RED),
    agent(state) {
      if (state.board[HEIGHT - 1][3] !== null) {
        return {
          cheat: {
            type: Connect4ActionType.PUT_TOKEN,
            column: 3,
            action2: {
              type: Connect4ActionType.PUT_TOKEN,
              column: 3,
            }
          }
        }
      }
      return {
        type: Connect4ActionType.PUT_TOKEN,
        column: 3
      }
    },
    score: () => {
      return 10
    }
  },
  [Connect4CaseType.C_AI_FLIP_TABLE_RANDOMLY]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.YELLOW),
    agent() {
      return {
        cheat: {
          type: Connect4ActionType.FLIP_TABLE
        }
      }
    },
    score: () => {
      return 10
    }
  },
  [Connect4CaseType.C_AI_NIL]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.YELLOW),
    agent() {
      return {
        cheat: {
          type: Connect4ActionType.PUT_TOKEN
        }
      }
    },
    score: () => {
      return 3
    }
  },
  [Connect4CaseType.C_AI_SURPRISE]: {
    initialStateGenerator: makeInitialStateGenerator(Connect4Turn.YELLOW),
    agent() {
      return {
        cheat: {
          type: 'SUPRISE! 😁' as unknown as Connect4ActionType
        }
      }
    },
    score: () => {
      return 4
    }
  }
})
