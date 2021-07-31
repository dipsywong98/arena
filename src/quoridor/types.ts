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
  o?: Orientation
}
