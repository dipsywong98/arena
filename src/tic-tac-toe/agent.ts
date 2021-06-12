import { alphaBetaTree } from '../AlphaBetaTree'
import { flip, Turn } from './utils'

export interface TicTacToeState {
  board: (Turn | null)[][]
  turn: Turn
}

export type TicTacToeAction = [number, number]

const scorer = (me: Turn) => (state: TicTacToeState) => {
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
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (state.board[i][j] === null) {
        moves.push([j, i])
      }
    }
  }
  return moves
}

const apply = (state: TicTacToeState, action: TicTacToeAction): TicTacToeState => {
  const dup = JSON.parse(JSON.stringify(state))
  dup.board[action[1]][action[0]] = dup.turn
  dup.turn = flip(dup.turn)
  return dup
}

const isEndGame = (state: TicTacToeState) => {
  for (let i = 0; i < 3; i++) {
    if (state.board[i][0] === state.board[i][1] && state.board[i][1] === state.board[i][2]) {
      return state.board[i][0] === state.turn
    }
    if (state.board[0][i] === state.board[1][i] && state.board[1][i] === state.board[2][i]) {
      return state.board[0][i] === state.turn
    }
  }
  if (state.board[0][0] === state.board[1][1] && state.board[1][1] === state.board[2][2]) {
    return state.board[1][1] === state.turn
  }
  if (state.board[2][0] === state.board[1][1] && state.board[1][1] === state.board[0][2]) {
    return state.board[1][1] === state.turn
  }
  return state.board.filter(row => row.findIndex(c => c === null) !== -1).length === 0
}

const getRandomAction = (state: TicTacToeState): TicTacToeAction | undefined => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (state.board[i][j] === null) {
        return [j, i]
      }
    }
  }
  return undefined
}

const agent = (state: TicTacToeState): TicTacToeAction | undefined => {
  return alphaBetaTree({
    state,
    generator,
    isEndGame,
    scorer: scorer(state.turn),
    depth: 9,
    maximize: true,
    alpha: -Infinity,
    beta: Infinity,
    apply
  }).action ?? getRandomAction(state)
}

export default agent
