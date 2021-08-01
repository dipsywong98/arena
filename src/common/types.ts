import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { Router } from 'express'

export const START_GAME = 'startGame'

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
  B> {
  initialStateGenerator: (battleId: string, runId: string) => Omit<B, 'type'>
  agent: (state: S) => A | { cheat: A }
  score: (battle: B) => number
}

export interface Action {
  // type: string,
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
}

type ProcessEvaluate = <ReqBody> (payload: ReqBody & EvaluatePayload) => (
  Promise<{ battleIds: string[], errors: unknown[] }>
  )

type Queues<M extends Move<A, Turn>, A extends Action, Turn> = {
  moveQueue: Queue<M>
  moveWorker: Worker<M>
  concludeQueue: Queue<ConcludeRequest>
  concludeWorker: Worker<ConcludeRequest>
}

type Stores<B extends Battle<CaseType, Result, S, Turn>,
  CaseType extends string,
  Result,
  S extends State,
  Turn> = {
  timerRead: (redis: Redis, battleId: string) => Promise<number>
  getBattle: (redis: Redis, battleId: string) => Promise<B | null>
  timerReset: (redis: Redis, battleId: string) => Promise<void>
  subscribeMessage: (
    redis: Redis,
    battleId: string,
    callback: (message: string) => (void | Promise<void>)
  ) => Promise<void>
  publishMessage: (
    redis: Redis,
    battleId: string,
    message: Record<string, unknown>) => Promise<void>
  setRun: (redis: Redis, run: Run) => Promise<void>
  getRun: (redis: Redis, runId: string) => Promise<Run | null>
  setBattle: (redis: Redis, battle: B) => Promise<void>
}

export interface ChallengeContext<A extends Action,
  B extends Battle<CaseType, Result, S, Turn>,
  CaseType extends string,
  M extends Move<A, Turn>,
  Result,
  S extends State,
  Turn,
  > {
  prefix: string
  TURN_ADD_MS: number
  processMove: (move: M) => Promise<unknown>
  processConclude: (r: ConcludeRequest) => Promise<unknown>
  processEvaluate: ProcessEvaluate
  queues?: Queues<M, A, Turn>
  stores?: Stores<B, CaseType, Result, S, Turn>,
  router?: Router
}
