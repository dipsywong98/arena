import { Redis } from 'ioredis'
import { Queue } from 'bullmq'

export enum CaseType {
  BASE_AI_O = 'BASE_AI_O',
  BASE_AI_X = 'BASE_AI_X',
  AB_AI_O = 'AB_AI_O',
  AB_AI_X = 'AB_AI_X',
  C_AI_X_FIRST = 'C_AI_X_FIRST',
  C_AI_DUP = 'C_AI_X_FIRST',
  C_AI_OUT_OF_BOUND = 'C_AI_OUT_OF_BOUND',
  C_AI_TWICE_A_ROW = 'C_AI_TWICE_A_ROW'
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
  initialStateGenerator: (battleId: string, gradeId: string) => Omit<Battle, 'type'>
  agent: (state: TicTacToeState) => TicTacToeAction
  score: number
}

export interface Battle {
  id: string
  gradeId: string
  externalPlayer: Turn
  result?: Result
  flippedReason?: string
  flippedBy?: Turn
  type: CaseType
  history: TicTacToeState[]
}

export interface Score {
  id: string
  score: number
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
