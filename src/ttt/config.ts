import { opposite } from './common'
import abAgent, { baseAgent } from './agent'
import {
  Battle,
  CaseType,
  Result,
  TestCase,
  TicTacToeActionType,
  Turn
} from './types'
import { playerWin } from './processMove'

const makeInitialStateGenerator = (aiTurn: Turn) =>
  (battleId: string, runId: string): Omit<Battle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: opposite(aiTurn),
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
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.BASE_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.AB_AI_O]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.O),
    agent: abAgent,
    score: (battle) => {
      return (playerWin(battle) || battle.result === Result.DRAW) ? 3 : 0
    }
  },
  [CaseType.AB_AI_X]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent: abAgent,
    score: (battle) => {
      return (playerWin(battle) || battle.result === Result.DRAW) ? 3 : 0
    }
  },
  [CaseType.C_AI_OUT_OF_BOUND]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent () {
      return {
        cheat: {
          type: TicTacToeActionType.PUT_SYMBOL, x: 3, y: 3
        }
      }
    },
    score: () => {
      return 1
    }
  },
  [CaseType.C_AI_DUP]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent (state) {
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
      return 1
    }
  },
  [CaseType.C_AI_X_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.X),
    agent: () => {
      return {
        cheat: {
          type: TicTacToeActionType.PUT_SYMBOL, x: 0, y: 0
        }
      }
    },
    score: () => {
      return 1
    }
  },
  [CaseType.C_AI_TWICE_A_ROW]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.O),
    agent (state) {
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
      return 1
    }
  }
})

// TODO ensure handle move only if started
// TODO shuffle the generated battle ids
// TODO time limit for submitting next move
// TODO compass coordinate system
// TODO gitlab ci
