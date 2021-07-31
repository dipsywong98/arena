import { EvaluatePayload } from '../common/types'

export function isEvaluatePayload (payload: unknown | EvaluatePayload): payload is EvaluatePayload {
  return typeof payload === 'object'
    && payload !== null
    && 'teamUrl' in payload
    && 'callbackUrl' in payload
    && 'runId' in payload
}

export enum CaseType {
  BASE_AI_O = 'BASE_AI_O',
  BASE_AI_X = 'BASE_AI_X',
  AB_AI_O = 'AB_AI_O',
  AB_AI_X = 'AB_AI_X',
  C_AI_X_FIRST = 'C_AI_X_FIRST',
  C_AI_DUP = 'C_AI_DUP',
  C_AI_OUT_OF_BOUND = 'C_AI_OUT_OF_BOUND',
  C_AI_TWICE_A_ROW = 'C_AI_TWICE_A_ROW'
}

export function isCaseType (p: string | undefined): p is CaseType {
  return p !== undefined && p in CaseType
}

export enum Turn {
  O = 'O',
  X = 'X'
}

export type Board = Array<Array<Turn | null>>

export interface TicTacToeState {
  turn: Turn
  board: Board
  expectFlip: boolean
  createdAt: number
}

export enum TicTacToeActionType {
  START_GAME = 'startGame', // internal
  PUT_SYMBOL = 'putSymbol',
  FLIP_TABLE = 'flipTable',
  END_GAME = 'endGame'// internal
}

export interface TicTacToeAction {
  type: TicTacToeActionType,
  x?: number
  y?: number
  action2?: TicTacToeAction
}

export interface TestCase {
  initialStateGenerator: (battleId: string, runId: string) => Omit<Battle, 'type'>
  agent: (state: TicTacToeState) => TicTacToeAction | { cheat: TicTacToeAction }
  score: (battle: Battle) => number
}

export interface Run {
  id: string
  battleIds: string[]
  callbackUrl: string
  score?: number
  message?: string
}

export interface Battle {
  id: string
  runId: string
  externalPlayer: Turn
  result?: Result
  flippedReason?: string
  flippedBy?: Turn
  type: CaseType
  history: TicTacToeState[]
  score?: number
  clock: number
}

export interface ConcludeRequest {
  runId: string
}

export interface Move {
  id: string
  battleId: string
  by: Turn
  action: TicTacToeAction
  elapsed: number
}

export enum Result {
  O_WIN = 'O_WIN',
  X_WIN = 'X_WIN',
  DRAW = 'DRAW',
  FLIPPED = 'FLIPPED',
}

