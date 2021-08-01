export interface EvaluatePayload {
  teamUrl: string
  callbackUrl: string
  runId: string
  caseType?: string
}

export function isEvaluatePayload (payload: unknown | EvaluatePayload): payload is EvaluatePayload {
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
  message?: string
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
  score?: number
  clock: number
}

export interface TestCase<S extends State,
  A extends Action,
  B extends Battle<unknown, unknown, S, unknown>> {
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

export interface Move<A extends Action, Turn> {
  id: string
  battleId: string
  by: Turn
  action: A
  elapsed: number
}
