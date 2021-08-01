import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { TicTacToeMove } from './types'
import { processConclude } from './processConclude'
import { processMove } from './processMove'
import { ConcludeRequest } from '../common/types'

// Create a new connection in every instance
export const moveQueue = new Queue<TicTacToeMove>('tttMoveQueue', { connection: redis })

export const moveWorker = new Worker<TicTacToeMove>('tttMoveQueue', async (job) => {
  const move = job.data
  return await processMove(move)
}, { connection: redis })

export const concludeQueue = new Queue<ConcludeRequest>('tttConcludeQueue', { connection: redis })
export const concludeWorker = new Worker<ConcludeRequest>('tttConcludeQueue', async (job) => {
  const concludeRequest = job.data
  return await processConclude(concludeRequest)
}, { connection: redis })
