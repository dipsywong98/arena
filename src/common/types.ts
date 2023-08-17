export const START_GAME = 'startGame'

export enum Game {
  TTT = 'ttt',
  QUORIDOR = 'quoridor',
  CONNECT4 = 'connect4',
}

export interface EvaluatePayload {
  teamUrl: string
  callbackUrl: string
  runId: string
  caseType?: string
}

export function isEvaluatePayload(payload: unknown | EvaluatePayload): payload is EvaluatePayload {
  return typeof payload === 'object'
    && payload !== null
    && 'teamUrl' in payload
    && 'callbackUrl' in payload
    && 'runId' in payload
}

export interface CallbackPayload {
  runId: string
  score: number
  message: string
}

export interface Run {
  id: string
  battleIds: string[]
  callbackUrl: string
  score?: number
  message?: unknown
  createdAt: number
  completedAt?: number
  errors?: Record<string, string>
}

export interface ConcludeRequest {
  runId: string
}

export interface State {
  turn: string
  expectFlip: boolean
  createdAt: number
}

export interface Battle<CaseType, Result, S extends State, Turn> {
  id: string
  runId: string
  externalPlayer: Turn
  result?: Result
  flippedReason?: string
  flippedBy?: Turn
  type: CaseType
  history: S[]
  moves: string[]
  score?: number
  clock: number
  createdAt: number
  completedAt?: number
}

export interface TestCase<S extends State,
  A extends Action,
  B> {
  initialStateGenerator: (battleId: string, runId: string) => Omit<B, 'type'>
  agent: (state: S) => A | { cheat: A }
  score: (battle: B) => number
}

export interface Action {
  type: string,
  x?: number
  y?: number
  action2?: Action
}

export interface Move<A, Turn> {
  id: string
  battleId: string
  by: Turn
  action: A
  elapsed: number
  error?: string
}

export interface MovePayload {
  game: Game
  move: Move<any, any>
}

export interface ConcludePayload {
  game: Game
  conclude: ConcludeRequest
}
