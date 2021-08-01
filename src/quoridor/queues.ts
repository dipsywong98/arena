import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { QuoridorMove } from './types'
import { processConclude } from './processConclude'
import { processMove } from './processMove'
import { ConcludeRequest } from '../common/types'

// Create a new connection in every instance
export const quoridorMoveQueue = new Queue<QuoridorMove>('quoridorMoveQueue', { connection: redis })

export const quoridorMoveWorker = new Worker<QuoridorMove>('quoridorMoveQueue', async (job) => {
  const move = job.data
  return await processMove(move)
}, { connection: redis })

export const quoridorConcludeQueue = new Queue<ConcludeRequest>(
  'quoridorConcludeQueue', { connection: redis })
export const quoridorConcludeWorker = new Worker<ConcludeRequest>(
  'quoridorConcludeQueue', async (job) => {
  const concludeRequest = job.data
  return await processConclude(concludeRequest)
}, { connection: redis })

