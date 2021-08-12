import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { TicTacToeMove } from './types'
import { processConclude } from './processConclude'
import { ConcludeRequest } from '../common/types'
import path from 'path'
import { processMove } from './processMove'

// Create a new connection in every instance
export const moveQueue = new Queue<TicTacToeMove>('tttMoveQueue', { connection: redis })

let worker
if (process.env.NODE_ENV === 'test') {
  worker = new Worker<TicTacToeMove>('tttMoveQueue', async (job) => {
    return await processMove(job.data)
  }, { connection: redis })
} else {
  const p = path.join(__dirname, 'sandboxedProcessor.ts')
  worker = new Worker<TicTacToeMove>('tttMoveQueue', p, { connection: redis })
}
export const moveWorker = worker

export const concludeQueue = new Queue<ConcludeRequest>('tttConcludeQueue', { connection: redis })
export const concludeWorker = new Worker<ConcludeRequest>('tttConcludeQueue', async (job) => {
  const concludeRequest = job.data
  return await processConclude(concludeRequest)
}, { connection: redis })
