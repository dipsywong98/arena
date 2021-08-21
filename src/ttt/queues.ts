import { Queue, Worker } from 'bullmq'
import redis from '../common/redis'
import { TicTacToeMove } from './types'
import { processConclude } from './processConclude'
import { ConcludeRequest } from '../common/types'
import path from 'path'
import { processMove } from './processMove'

// Create a new connection in every instance
export const tttMoveQueue = new Queue<TicTacToeMove>('tttMoveQueue', { connection: redis })

let worker
if (process.env.NODE_ENV === 'test') {
  worker = new Worker<TicTacToeMove>('tttMoveQueue', async (job) => {
    return await processMove(job.data)
  }, { connection: redis })
} else {
  const ext = process.env.NODE_ENV === 'development' ? 'ts' : 'js'
  const p = path.join(__dirname, `sandboxedProcessor.${ext}`)
  worker = new Worker<TicTacToeMove>('tttMoveQueue', p, { connection: redis })
}
export const ticTacToeMoveWorker = worker

export const ticTacToeConcludeQueue = new Queue<ConcludeRequest>(
  'tttConcludeQueue', { connection: redis }
)
export const ticTacToeConcludeWorker = new Worker<ConcludeRequest>(
  'tttConcludeQueue',
  async (job) => {
    const concludeRequest = job.data
    return await processConclude(concludeRequest)
  }, { connection: redis })
