import { Redis } from 'ioredis'
import { Queue } from 'bullmq'

export interface EvaluatePayload {
  teamUrl: string
  callbackUrl: string
  runId: string
  caseType?: CaseType
}

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
}

export interface TestCase {
  initialStateGenerator: (battleId: string, runId: string) => Omit<Battle, 'type'>
  agent: (state: TicTacToeState) => TicTacToeAction
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
}

export interface Score {
  runId: string
}

export interface Move {
  id: string
  battleId: string
  by: Turn
  action: TicTacToeAction
}

export interface AppContext {
  pubRedis: Redis
  subRedis: Redis
  battleQueue: Queue<Battle>
  scoreQueue: Queue<Score>
  incomingMoveQueue: Queue<Move>
}

export enum Result {
  O_WIN = 'O_WIN',
  X_WIN = 'X_WIN',
  DRAW = 'DRAW',
  FLIPPED = 'FLIPPED',
}

export interface CallbackPayload {
  runId: string
  score: number
  message: string
}
