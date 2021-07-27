import { Result, TicTacToeAction, TicTacToeActionType, TicTacToeState, Turn } from './types'
import produce from 'immer'

export const flip = (turn: Turn) => turn === Turn.X ? Turn.O : Turn.X

export const isEndGame = (state: TicTacToeState): boolean => {
  for (let i = 0; i < 3; i++) {
    if (state.board[i][0] === state.board[i][1]
      && state.board[i][1] === state.board[i][2]) {
      return state.board[i][0] === state.turn
    }
    if (state.board[0][i] === state.board[1][i]
      && state.board[1][i] === state.board[2][i]) {
      return state.board[0][i] === state.turn
    }
  }
  if (state.board[0][0] === state.board[1][1]
    && state.board[1][1] === state.board[2][2]) {
    return state.board[1][1] === state.turn
  }
  if (state.board[2][0] === state.board[1][1]
    && state.board[1][1] === state.board[0][2]) {
    return state.board[1][1] === state.turn
  }
  return state.board.filter(row => row.findIndex(c => c === null) !== -1).length === 0
}

export const getResult = (state: TicTacToeState): Result | undefined => {
  for (let i = 0; i < 3; i++) {
    if (state.board[i][0] !== null
      && state.board[i][0] === state.board[i][1]
      && state.board[i][1] === state.board[i][2]) {
      return state.board[i][0] === Turn.O ? Result.O_WIN : Result.X_WIN
    }
    if (state.board[0][i] !== null
      && state.board[0][i] === state.board[1][i]
      && state.board[1][i] === state.board[2][i]) {
      return state.board[0][i] === Turn.O ? Result.O_WIN : Result.X_WIN
    }
  }
  if (state.board[0][0] !== null
    && state.board[0][0] === state.board[1][1]
    && state.board[1][1] === state.board[2][2]) {
    return state.board[1][1] === Turn.O ? Result.O_WIN : Result.X_WIN
  }
  if (state.board[2][0] !== null
    && state.board[2][0] === state.board[1][1]
    && state.board[1][1] === state.board[0][2]) {
    return state.board[1][1] === Turn.O ? Result.O_WIN : Result.X_WIN
  }
  const noEmptySpace = state.board.filter(row => row.findIndex(c => c === null) !== -1).length === 0
  return noEmptySpace ? Result.DRAW : undefined
}

export const applyAction = (state: TicTacToeState, action: TicTacToeAction): TicTacToeState => {
  const y = action.y
  const x = action.x
  if (action.type === TicTacToeActionType.PUT_SYMBOL && y !== undefined && x !== undefined) {
    return produce(state, draft => {
      draft.board[y][x] = state.turn
      draft.turn = flip(state.turn)
    })
  }
  return state
}
