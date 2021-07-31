import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { ConcludeRequest, Move } from './types'
import { processConclude } from './processConclude'
import { processMove } from './processMove'

// Create a new connection in every instance
export const moveQueue = new Queue<Move>('moveQueue', { connection: redis })

export const moveWorker = new Worker<Move>('moveQueue', async (job) => {
  const move = job.data
  return await processMove(move)
}, { connection: redis })

export const concludeQueue = new Queue<ConcludeRequest>('concludeQueue', { connection: redis })
export const concludeWorker = new Worker<ConcludeRequest>('concludeQueue', async (job) => {
  const concludeRequest = job.data
  return await processConclude(concludeRequest)
}, { connection: redis })
