import { alphaBetaTree } from '../common/AlphaBetaTree'
import { applyAction, isEndGame } from './common'
import { TicTacToeAction, TicTacToeActionType, TicTacToeState, TicTacToeTurn } from './types'

const scorer = (me: TicTacToeTurn) => (state: TicTacToeState): number => {
  for (let i = 0; i < 3; i++) {
    if (state.board[i][0] === state.board[i][1] && state.board[i][1] === state.board[i][2]) {
      return state.board[i][0] === me ? 100 : -100
    }
    if (state.board[0][i] === state.board[1][i] && state.board[1][i] === state.board[2][i]) {
      return state.board[0][i] === me ? 100 : -100
    }
  }
  if (state.board[0][0] === state.board[1][1] && state.board[1][1] === state.board[2][2]) {
    return state.board[1][1] === me ? 100 : -100
  }
  if (state.board[2][0] === state.board[1][1] && state.board[1][1] === state.board[0][2]) {
    return state.board[1][1] === me ? 100 : -100
  }
  return 0
}

const generator = (state: TicTacToeState): TicTacToeAction[] => {
  const moves: TicTacToeAction[] = []
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (state.board[y][x] === null) {
        moves.push({
          type: TicTacToeActionType.PUT_SYMBOL,
          x,
          y
        })
      }
    }
  }
  return moves
}

export type TicTacToeAgent = (state: TicTacToeState) => TicTacToeAction

export const baseAgent: TicTacToeAgent = (state) => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (state.board[i][j] === null) {
        return {
          type: TicTacToeActionType.PUT_SYMBOL,
          x: j,
          y: i
        }
      }
    }
  }
  return {
    type: TicTacToeActionType.END_GAME
  }
}

export const abAgent: TicTacToeAgent = (state): TicTacToeAction => {
  return alphaBetaTree({
    state,
    generator,
    isEndGame,
    scorer: scorer(state.turn),
    depth: 9,
    maximize: true,
    alpha: -Infinity,
    beta: Infinity,
    apply: applyAction
  }).action ?? baseAgent(state)
}

export default abAgent
