import { assert } from 'console'
import { FLIP_TABLE } from '../common/constants'
import { Action, Battle, Move, State, TestCase } from '../common/types'

export enum TicTacToeCaseType {
  BASE_AI_O = 'BASE_AI_O',
  BASE_AI_X = 'BASE_AI_X',
  AB_AI_O = 'AB_AI_O',
  AB_AI_X = 'AB_AI_X',
  C_AI_X_FIRST = 'C_AI_X_FIRST',
  C_AI_DUP = 'C_AI_DUP',
  C_AI_OUT_OF_BOUND = 'C_AI_OUT_OF_BOUND',
  C_AI_TWICE_A_ROW = 'C_AI_TWICE_A_ROW',
  C_AI_FLIP_TABLE_RANDOMLY = 'C_AI_FLIP_TABLE_RANDOMLY',
}

export function isCaseType (p: string | undefined): p is TicTacToeCaseType {
  return p !== undefined && p in TicTacToeCaseType
}

export enum TicTacToeTurn {
  O = 'O',
  X = 'X'
}

export type Board = Array<Array<TicTacToeTurn | null>>

export interface TicTacToeState extends State {
  turn: TicTacToeTurn
  board: Board
}

export enum TicTacToeActionType {
  START_GAME = 'startGame', // internal
  PUT_SYMBOL = 'putSymbol',
  FLIP_TABLE = '(╯°□°)╯︵ ┻━┻',
  END_GAME = 'endGame', // internal
  INVALID_ACTION = 'invalidAction' // internal
}

assert(TicTacToeActionType.FLIP_TABLE === FLIP_TABLE)

export interface TicTacToeAction extends Action {
  type: TicTacToeActionType,
  x?: number
  y?: number
  action2?: TicTacToeAction
}

export type TicTacToeTestCase = TestCase<TicTacToeState, TicTacToeAction, TicTacToeBattle>
export type TicTacToeBattle = (
  Battle<TicTacToeCaseType, TicTacToeResult, TicTacToeState, TicTacToeTurn>
)
export type TicTacToeMove = Move<ExternalAction, TicTacToeTurn>

export enum TicTacToeResult {
  O_WIN = 'O_WIN',
  X_WIN = 'X_WIN',
  DRAW = 'DRAW',
  FLIPPED = 'FLIPPED',
}

export interface ExternalAction {
  action: TicTacToeActionType
  position?: string
  player?: string // for outgoing only
  [other: string]: unknown
}
