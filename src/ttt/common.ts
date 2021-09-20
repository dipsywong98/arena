import {
  ExternalAction,
  TicTacToeAction,
  TicTacToeActionType,
  TicTacToeResult,
  TicTacToeState,
  TicTacToeTurn
} from './types'
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
      try {
        draft.board[y][x] = state.turn
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

export const compassToCoord: Record<string, [number, number]> = {
  NW: [0, 0],
  N: [1, 0],
  NE: [2, 0],
  W: [0, 1],
  C: [1, 1],
  E: [2, 1],
  SW: [0, 2],
  S: [1, 2],
  SE: [2, 2]
}

export const internalizeAction = (action: ExternalAction): TicTacToeAction => {
  if (action.action === TicTacToeActionType.PUT_SYMBOL) {
    if (action.position !== undefined
      && compassToCoord[action.position] !== undefined) {
      const [x, y] = compassToCoord[action.position]
      return {
        type: action.action,
        x,
        y
      }
    } else {
      throw new Error(`${action.position ?? 'undefined'} is not a valid position`)
    }
  } else {
    return {
      type: action.action
    }
  }
}


export const coordToCompass: Record<string, string> = {
  '0,0': 'NW',
  '1,0': 'N',
  '2,0': 'NE',
  '0,1': 'W',
  '1,1': 'C',
  '2,1': 'E',
  '0,2': 'SW',
  '1,2': 'S',
  '2,2': 'SE'
}
export const externalizeAction = (
  action: TicTacToeAction,
  player?: string,
  rest?: Record<string, unknown>): ExternalAction => {
  if (action.type === TicTacToeActionType.PUT_SYMBOL) {
    const { x, y } = action
    if (x !== undefined && y !== undefined) {
      const key = `${x},${y}`
      if (coordToCompass[key] !== undefined) {
        return {
          action: action.type,
          position: coordToCompass[key],
          player,
          ...rest
        }
      }
    }
    return {
      action: action.type,
      position: '',
      player,
      ...rest
    }
  } else {
    return {
      action: action.type,
      player,
      ...rest
    }
  }
}
