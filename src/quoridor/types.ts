import { Action, Battle, Move, State, TestCase } from '../common/types'

export enum QuoridorCaseType {
  BASE_AI_FIRST = 'BASE_AI_FIRST',
  BASE_AI_SECOND = 'BASE_AI_SECOND',
  AB_AI_FIRST = 'AB_AI_FIRST',
  AB_AI_SECOND = 'AB_AI_SECOND',
  C_AI_TELEPORT = 'C_AI_TELEPORT',
  C_AI_SECOND_FIRST = 'C_AI_SECOND_FIRST',
  C_AI_TWICE_A_ROW = 'C_AI_TWICE_A_ROW',
  C_AI_WALL_OUTSIDE = 'C_AI_WALL_OUTSIDE',
  C_AI_PAWN_OUTSIDE = 'C_AI_PAWN_OUTSIDE',
  C_AI_WALL_CROSS = 'C_AI_WALL_CROSS',
  C_AI_WALL_BLOCKING = 'C_AI_WALL_BLOCKING',
}

export function isCaseType(p: string | undefined): p is QuoridorCaseType {
  return p !== undefined && p in QuoridorCaseType
}

export type QuoridorTestCase = TestCase<QuoridorState, QActionInternal, QuoridorBattle>

export interface Player extends Coord {
  walls: number
}

export enum QuoridorTurn {
  FIRST = 'first',
  SECOND = 'second'
}

export type Walls = Array<Array<boolean>>

export enum Orientation {
  VERTICAL = '|',
  HORIZONTAL = '-'
}

export interface QuoridorState extends State {
  walls: Walls
  players: Record<QuoridorTurn, Player>
  turn: QuoridorTurn
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

export interface QActionInternal extends Coord {
  type: QuoridorActionType
  o?: Orientation
}

export interface QuoridorAction extends Action {
  type: QuoridorActionType
  x?: number
  y?: number
  o?: Orientation
  action2?: QuoridorAction
}

export type QuoridorBattle = Battle<
  QuoridorCaseType, QuoridorResult, QuoridorState, QuoridorTurn>
export type QuoridorMove = Move<ExternalAction, QuoridorTurn>

export enum QuoridorResult {
  FIRST_WIN = 'FIRST_WIN',
  SECOND_WIN = 'SECOND_WIN',
  FLIPPED = 'FLIPPED',
}

export enum QuoridorActionType {
  START_GAME = 'startGame', // internal
  MOVE = 'move',
  PUT_WALL = 'putWall',
  FLIP_TABLE = 'flipTable',
  INVALID_ACTION = 'invalidAction'// internal
}

export interface ExternalAction {
  action: QuoridorActionType
  position?: string
  [other: string]: unknown
}
