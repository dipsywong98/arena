import {
  ExternalAction,
  Connect4Action,
  Connect4ActionType,
  Connect4Result,
  Connect4State,
  Connect4Turn,
  COLUMNS,
  Column
} from './types'
import produce from 'immer'


export const WIDTH = COLUMNS.length;
export const HEIGHT = 6;

export const opposite = (turn: Connect4Turn) => (
  turn === Connect4Turn.RED ? Connect4Turn.YELLOW : Connect4Turn.RED
)

export const isPlayerWin = (state: Connect4State, turn: Connect4Turn): boolean => {
  // check horizontal
  for (let j = 0; j < HEIGHT; j++) {
    for (let i = 0; i < WIDTH - 3; i++) {
      if (
        state.board[j][i] === turn &&
        state.board[j][i] === state.board[j][i + 1] &&
        state.board[j][i] === state.board[j][i + 2] &&
        state.board[j][i] === state.board[j][i + 3]
      ) {
        return true
      }
    }
  }

  // check vertical
  for (let i = 0; i < WIDTH; i++) {
    for (let j = 0; j < HEIGHT - 3; j++) {
      if (
        state.board[j][i] === turn &&
        state.board[j][i] === state.board[j + 1][i] &&
        state.board[j][i] === state.board[j + 2][i] &&
        state.board[j][i] === state.board[j + 3][i]
      ) {
        return true
      }
    }
  }

  // ascending diagonal
  for (let i = 0; i < WIDTH - 3; i++) {
    for (let j = 0; j < HEIGHT - 3; j++) {
      if (
        state.board[j][i] === turn &&
        state.board[j][i] === state.board[j + 1][i + 1] &&
        state.board[j][i] === state.board[j + 2][i + 2] &&
        state.board[j][i] === state.board[j + 3][i + 3]
      ) {
        return true
      }
    }
  }

  // descending diagonal
  for (let i = 0; i < WIDTH - 3; i++) {
    for (let j = HEIGHT - 1; j > 2; j--) {
      if (
        state.board[j][i] === turn &&
        state.board[j][i] === state.board[j - 1][i + 1] &&
        state.board[j][i] === state.board[j - 2][i + 2] &&
        state.board[j][i] === state.board[j - 3][i + 3]
      ) {
        return true
      }
    }
  }
  return false;
}

export const isDraw = (state: Connect4State): boolean => {
  return COLUMNS.every((_, index) => isColumnFull(state, index))
}

export const getResult = (state: Connect4State): Connect4Result | undefined => {
  if (isPlayerWin(state, Connect4Turn.RED)) {
    return Connect4Result.RED_WIN
  }
  if (isPlayerWin(state, Connect4Turn.YELLOW)) {
    return Connect4Result.YELLOW_WIN
  }
  if (isDraw(state)) {
    return Connect4Result.DRAW
  }
  return undefined
}

export const isEndGame = (state: Connect4State): boolean => {
  return getResult(state) !== undefined
}

export const isColumnFull = (state: Connect4State, column: number): boolean => {
  return state.board[0][column] !== null
}

const takeColumn = (state: Connect4State, column: number): Array<Connect4Turn | null> => {
  return state.board.map(row => row[column])
}

export const applyAction = (state: Connect4State, action: Connect4Action): Connect4State => {
  let nextState = state
  if (action.type === Connect4ActionType.PUT_TOKEN && action.column !== undefined) {
    const col = action.column
    nextState = produce(state, draft => {
      try {
        const lastEmptyRow = takeColumn(draft, col).lastIndexOf(null)
        draft.board[lastEmptyRow][col] = state.turn
      } catch (e) {
        // outside of the board just ignore it
      }
      draft.turn = opposite(state.turn)
      draft.createdAt = Date.now()
    })
  }
  if (action.action2 !== undefined) {
    nextState = applyAction({ ...nextState, turn: state.turn }, action.action2)
  }
  return nextState
}


export const internalizeAction = (action: ExternalAction): Connect4Action => {
  if (action.action === Connect4ActionType.PUT_TOKEN) {
    if (action.column !== undefined && COLUMNS.includes(action.column)) {
      return {
        type: action.action,
        column: COLUMNS.indexOf(action.column)
      }
    } else {
      throw new Error(`${action.column ?? 'undefined'} is not a valid column`)
    }
  } else {
    return {
      type: action.action
    }
  }
}

export const externalizeAction = (
  action: Connect4Action,
  player?: string,
  rest?: Record<string, unknown>): ExternalAction => {
  if (action.type === Connect4ActionType.PUT_TOKEN) {
    if (action.column !== undefined && action.column >= 0 && action.column < WIDTH) {
      return {
        action: action.type,
        player,
        ...rest,
        column: COLUMNS[action.column]
      }
    } else {
      // intended to return a bad column
      return {
        action: action.type,
        player,
        ...rest,
        column: action.column as unknown as Column
      }
    }
  }
  return {
    action: action.type,
    player,
    ...rest
  }
}
