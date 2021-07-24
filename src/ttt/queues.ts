import { Queue, Worker } from 'bullmq'

import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { makeRedis } from '../redis'
import { processMove } from './core'
import { Battle, Move, Score } from './types'

const redis = makeRedis()
// Create a new connection in every instance
export const battleQueue = new Queue<Battle>('battleQueue', { connection: redis })
export const scoreQueue = new Queue<Score>('scoreQueue', { connection: redis })
export const moveQueue = new Queue<Move>('moveQueue', { connection: redis })

export const moveWorker = new Worker<Move>('moveQueue', async (job) => {
  const move = job.data
  return await processMove(move)
}, { connection: redis })

export const serverAdapter = new ExpressAdapter()

createBullBoard({
  queues: [
    new BullMQAdapter(battleQueue),
    new BullMQAdapter(scoreQueue),
    new BullMQAdapter(moveQueue)
  ],
  serverAdapter
})

serverAdapter.setBasePath('/admin/queues')
