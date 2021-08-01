import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { Action, Battle, ChallengeContext, ConcludeRequest, Move, State } from './types'

export const makeQueue = <A extends Action,
  B extends Battle<CaseType,Result,S,Turn>,
  CaseType extends string,
  M extends Move<A, Turn>,
  Result,
  S extends State,
  Turn,
  C extends ChallengeContext<A,B,CaseType, M, Result, S, Turn>
  >
(ctx: C): C => {
  const { prefix, processMove, processConclude } = ctx
  const moveQueue = new Queue<M>(`${prefix}MoveQueue`, { connection: redis })

  const moveWorker = new Worker<M>(`${prefix}MoveQueue`, async (job) => {
    const move = job.data
    return await processMove(move)
  }, { connection: redis })

  const concludeQueue = new Queue<ConcludeRequest>(
    `${prefix}ConcludeQueue`, { connection: redis })
  const concludeWorker = new Worker<ConcludeRequest>(
    `${prefix}ConcludeQueue`, async (job) => {
      const concludeRequest = job.data
      return await processConclude(concludeRequest)
    }, { connection: redis })

  return {
    ...ctx,
    queues: {
      moveQueue,
      moveWorker,
      concludeQueue,
      concludeWorker
    }
  }
}

// Create a new connection in every instance
