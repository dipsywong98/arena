import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { QuoridorMove } from './types'
import { processConclude } from './processConclude'
import { ConcludeRequest } from '../common/types'
import path from 'path'

// Create a new connection in every instance
export const quoridorMoveQueue = new Queue<QuoridorMove>('quoridorMoveQueue', { connection: redis })

const p = path.join(__dirname, 'sandboxedProcessor.ts')
export const quoridorMoveWorker = new Worker<QuoridorMove>(
  'quoridorMoveQueue', p, { connection: redis })

export const quoridorConcludeQueue = new Queue<ConcludeRequest>(
  'quoridorConcludeQueue', { connection: redis })
export const quoridorConcludeWorker = new Worker<ConcludeRequest>(
  'quoridorConcludeQueue', async (job) => {
    const concludeRequest = job.data
    return await processConclude(concludeRequest)
  }, { connection: redis })

