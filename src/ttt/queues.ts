import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { TicTacToeMove } from './types'
import { processConclude } from './processConclude'
import { ConcludeRequest } from '../common/types'
import path from 'path'

// Create a new connection in every instance
export const moveQueue = new Queue<TicTacToeMove>('tttMoveQueue', { connection: redis })

const p = path.join(__dirname, 'sandboxedProcessor.ts')
export const moveWorker = new Worker<TicTacToeMove>('tttMoveQueue', p, { connection: redis })

export const concludeQueue = new Queue<ConcludeRequest>('tttConcludeQueue', { connection: redis })
export const concludeWorker = new Worker<ConcludeRequest>('tttConcludeQueue', async (job) => {
  const concludeRequest = job.data
  return await processConclude(concludeRequest)
}, { connection: redis })
