import { TicTacToeResult,
  TicTacToeAction,
  TicTacToeActionType,
  TicTacToeState,
  TicTacToeTurn } from './types'
import produce from 'immer'

export const opposite = (turn: TicTacToeTurn) => (
  turn === TicTacToeTurn.X ? TicTacToeTurn.O : TicTacToeTurn.X
)

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

export const getResult = (state: TicTacToeState): TicTacToeResult | undefined => {
  for (let i = 0; i < 3; i++) {
    if (state.board[i][0] !== null
      && state.board[i][0] === state.board[i][1]
      && state.board[i][1] === state.board[i][2]) {
      return state.board[i][0] === TicTacToeTurn.O ? TicTacToeResult.O_WIN : TicTacToeResult.X_WIN
    }
    if (state.board[0][i] !== null
      && state.board[0][i] === state.board[1][i]
      && state.board[1][i] === state.board[2][i]) {
      return state.board[0][i] === TicTacToeTurn.O ? TicTacToeResult.O_WIN : TicTacToeResult.X_WIN
    }
  }
  if (state.board[0][0] !== null
    && state.board[0][0] === state.board[1][1]
    && state.board[1][1] === state.board[2][2]) {
    return state.board[1][1] === TicTacToeTurn.O ? TicTacToeResult.O_WIN : TicTacToeResult.X_WIN
  }
  if (state.board[2][0] !== null
    && state.board[2][0] === state.board[1][1]
    && state.board[1][1] === state.board[0][2]) {
    return state.board[1][1] === TicTacToeTurn.O ? TicTacToeResult.O_WIN : TicTacToeResult.X_WIN
  }
  const noEmptySpace = state.board.filter(row => row.findIndex(c => c === null) !== -1).length === 0
  return noEmptySpace ? TicTacToeResult.DRAW : undefined
}

export const applyAction = (state: TicTacToeState, action: TicTacToeAction): TicTacToeState => {
  const y = action.y
  const x = action.x
  let nextState = state
  if (action.type === TicTacToeActionType.PUT_SYMBOL && y !== undefined && x !== undefined) {
    nextState = produce(state, draft => {
      try{
        draft.board[y][x] = state.turn
      } catch (e) {
        // outside of the board just ignore it
      }
      draft.turn = opposite(state.turn)
    })
  }
  if (action.action2 !== undefined) {
    nextState = applyAction({ ...nextState, turn: state.turn }, action.action2)
  }
  return nextState
}
