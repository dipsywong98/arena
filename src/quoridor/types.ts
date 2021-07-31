export enum CaseType {
  BASE_AI_BLACK = 'BASE_AI_BLACK',
  BASE_AI_WHITE = 'BASE_AI_WHITE',
  AB_AI_BLACK = 'AB_AI_BLACK',
  AB_AI_WHITE = 'AB_AI_WHITE',
  C_AI_WHITE_FIRST = 'C_AI_WHITE_FIRST'
}

export function isCaseType (p: string | undefined): p is CaseType {
  return p !== undefined && p in CaseType
}

export interface TestCase {
  initialStateGenerator: (battleId: string, runId: string) => Omit<Battle, 'type'>
  agent: (state: State) => Action | { cheat: Action }
  score: (battle: Battle) => number
}

export interface Player extends Coord {
  walls: number
}

export enum Turn {
  BLACK = 'black',
  WHITE = 'white'
}

export type Walls = Array<Array<boolean>>

export enum Orientation {
  VERTICAL = '|',
  HORIZONTAL = '-'
}

export interface State {
  walls: Walls
  players: Record<Turn, Player>
  turn: Turn
  expectFlip: boolean
}

export interface Coord {
  x: number,
  y: number
}

export interface Node extends Coord {
  sourceDistance: number
  targetDistance: number
}

export interface Action extends Coord {
  type: ActionType
  o?: Orientation
}

export interface QuoridorActionPayload {
  type: ActionType
  x?: number
  y?: number
  o?: Orientation
  action2?: QuoridorActionPayload
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
  history: State[]
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
  action: QuoridorActionPayload
  elapsed: number
}

export enum Result {
  BLACK_WIN = 'BLACK_WIN',
  WHITE_WIN = 'WHITE_WIN',
  FLIPPED = 'FLIPPED',
}

export enum ActionType {
  START_GAME = 'startGame', // internal
  MOVE = 'move',
  PUT_WALL = 'putWall',
  FLIP_TABLE = 'flipTable',
  END_GAME = 'endGame'// internal
}
