import { Action, Battle, Move, State, TestCase } from '../common/types'

export enum QuoridorCaseType {
  BASE_AI_BLACK = 'BASE_AI_BLACK',
  BASE_AI_WHITE = 'BASE_AI_WHITE',
  AB_AI_BLACK = 'AB_AI_BLACK',
  AB_AI_WHITE = 'AB_AI_WHITE',
  C_AI_WHITE_FIRST = 'C_AI_WHITE_FIRST'
}

export function isCaseType (p: string | undefined): p is QuoridorCaseType {
  return p !== undefined && p in QuoridorCaseType
}

export type QuoridorTestCase = TestCase<QuoridorState, QActionInternal, QuoridorBattle>

export interface Player extends Coord {
  walls: number
}

export enum QuoridorTurn {
  BLACK = 'black',
  WHITE = 'white'
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
export type QuoridorMove = Move<QuoridorAction, QuoridorTurn>

export enum QuoridorResult {
  BLACK_WIN = 'BLACK_WIN',
  WHITE_WIN = 'WHITE_WIN',
  FLIPPED = 'FLIPPED',
}

export enum QuoridorActionType {
  START_GAME = 'startGame', // internal
  MOVE = 'move',
  PUT_WALL = 'putWall',
  FLIP_TABLE = 'flipTable',
  END_GAME = 'endGame'// internal
}
