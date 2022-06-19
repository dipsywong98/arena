import { assert } from 'console'
import { FLIP_TABLE } from '../common/constants'
import { Action, Battle, Move, State, TestCase } from '../common/types'

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

export enum Connect4CaseType {
  BASE_AI_R = 'BASE_AI_R',
  BASE_AI_Y = 'BASE_AI_Y',
  AB_AI_R = 'AB_AI_R',
  AB_AI_Y = 'AB_AI_Y',
  C_AI_Y_FIRST = 'C_AI_Y_FIRST',
  C_AI_OVERFLOW = 'C_AI_OVERFLOW',
  C_AI_OUT_OF_BOUND = 'C_AI_OUT_OF_BOUND',
  C_AI_TWICE_A_ROW = 'C_AI_TWICE_A_ROW',
  C_AI_NIL = 'C_AI_NIL',
  C_AI_FLIP_TABLE_RANDOMLY = 'C_AI_FLIP_TABLE_RANDOMLY',
  C_AI_SURPRISE = 'C_AI_SURPRISE',
}

export function isCaseType (p: string | undefined): p is Connect4CaseType {
  return p !== undefined && p in Connect4CaseType
}

export enum Connect4Turn {
  YELLOW = '🟡',
  RED = '🔴'
}

export type Board = Array<Array<Connect4Turn | null>>

export interface Connect4State extends State {
  turn: Connect4Turn
  board: Board
}

export enum Connect4ActionType {
  START_GAME = 'startGame', // internal
  PUT_TOKEN = 'putToken',
  FLIP_TABLE = '(╯°□°)╯︵ ┻━┻',
  END_GAME = 'endGame', // internal
  INVALID_ACTION = 'invalidAction' // internal
}

assert(Connect4ActionType.FLIP_TABLE === FLIP_TABLE)

export interface Connect4Action extends Action {
  type: Connect4ActionType
  column?: number
  action2?: Connect4Action
}

export type Connect4TestCase = TestCase<Connect4State, Connect4Action, Connect4Battle>
export type Connect4Battle = (
  Battle<Connect4CaseType, Connect4Result, Connect4State, Connect4Turn>
)
export type Connect4Move = Move<ExternalAction, Connect4Turn>

export enum Connect4Result {
  RED_WIN = 'RED_WIN',
  YELLOW_WIN = 'YELLOW_WIN',
  DRAW = 'DRAW',
  FLIPPED = 'FLIPPED',
}

export interface ExternalAction {
  action: Connect4ActionType
  column?: typeof COLUMNS[number]
  player?: string // for outgoing only
  [other: string]: unknown
}
