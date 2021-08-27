import { opposite } from './common'
import abAgent, { baseAgent } from './agent'
import {
  TicTacToeActionType,
  TicTacToeBattle,
  TicTacToeCaseType,
  TicTacToeResult,
  TicTacToeTestCase,
  TicTacToeState,
  TicTacToeTurn
} from './types'
import { playerWin } from './processMove'

export const INITIAL_CLOCK_MS = 18 * 1000

export const initState = (): TicTacToeState => {
  return {
    expectFlip: false,
    turn: TicTacToeTurn.O,
    board: [[null, null, null], [null, null, null], [null, null, null]],
    createdAt: Date.now()
  }
}

const makeInitialStateGenerator = (aiTurn: TicTacToeTurn) =>
  (battleId: string, runId: string): Omit<TicTacToeBattle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: opposite(aiTurn),
    history: [initState()],
    moves: [],
    clock: INITIAL_CLOCK_MS,
    createdAt: Date.now()
  })

export const TURN_ADD_MS = 2 * 1000

export const config: Record<TicTacToeCaseType, TicTacToeTestCase> = Object.freeze({
  [TicTacToeCaseType.BASE_AI_O]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.O),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 20 : 0
    }
  },
  [TicTacToeCaseType.BASE_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.X),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 20 : 0
    }
  },
  [TicTacToeCaseType.AB_AI_O]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.O),
    agent: abAgent,
    score: (battle) => {
      return (playerWin(battle) || battle.result === TicTacToeResult.DRAW) ? 20 : 0
    }
  },
  [TicTacToeCaseType.AB_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.X),
    agent: abAgent,
    score: (battle) => {
      return (playerWin(battle) || battle.result === TicTacToeResult.DRAW) ? 20 : 0
    }
  },
  [TicTacToeCaseType.C_AI_OUT_OF_BOUND]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.X),
    agent() {
      return {
        cheat: {
          type: TicTacToeActionType.PUT_SYMBOL, x: 3, y: 3
        }
      }
    },
    score: () => {
      return 5
    }
  },
  [TicTacToeCaseType.C_AI_DUP]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.X),
    agent(state) {
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          if (state.board[y][x] !== null) {
            return {
              cheat: {
                type: TicTacToeActionType.PUT_SYMBOL, x, y
              }
            }
          }
        }
      }
      return baseAgent(state)
    },
    score: () => {
      return 5
    }
  },
  [TicTacToeCaseType.C_AI_X_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.X),
    agent: () => {
      return {
        cheat: {
          type: TicTacToeActionType.PUT_SYMBOL, x: 0, y: 0
        }
      }
    },
    score: () => {
      return 5
    }
  },
  [TicTacToeCaseType.C_AI_TWICE_A_ROW]: {
    initialStateGenerator: makeInitialStateGenerator(TicTacToeTurn.O),
    agent(state) {
      if (state.board[0][0] !== null) {
        const points = [
          [1, 0],
          [0, 1],
          [2, 1],
          [1, 2],
          [2, 2]
        ]
        let p1: { x: number, y: number } | undefined
        for (const [x, y] of points) {
          if (state.board[y][x] === null) {
            if (p1 === undefined) {
              p1 = { x, y }
            } else {
              return {
                cheat: {
                  type: TicTacToeActionType.PUT_SYMBOL,
                  x,
                  y,
                  action2: {
                    type: TicTacToeActionType.PUT_SYMBOL,
                    ...p1
                  }
                }
              }
            }
          }
        }
      }
      return {
        type: TicTacToeActionType.PUT_SYMBOL,
        x: 0,
        y: 0
      }
    },
    score: () => {
      return 5
    }
  }
})

// TODO lock the battle when is still processing
// TODO compress the quoridor board
// TODO expose endpoint to clear redis
// TODO ensure handle move only if started (actually no need)
// TODO overall TLE
// TODO more support endpoint
// TODO seperate quoridor agent to another host, perhaps a even more chanllenging one
// TODO upper limit of turns
