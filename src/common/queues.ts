import { Queue, Worker } from 'bullmq'
import path from 'path'
import { opt } from '../common/redis'
import logger from './logger'
import { processConclude } from './processConclude'
import { processMove } from './processMove'
import { ConcludePayload, MovePayload } from './types'

let moveQueue: Queue<MovePayload, any, string> | undefined
let concludeQueue: Queue<ConcludePayload, any, string> | undefined

export const getMoveQueue = () => {
  if (moveQueue === undefined) {
    moveQueue = new Queue<MovePayload>('moveQueue', opt)
  }
  return moveQueue
}

export const getConcludeQueue = () => {
  if (concludeQueue === undefined) {
    concludeQueue = new Queue<ConcludePayload>('concludeQueue', opt)
  }
  return concludeQueue
}

let moveWorker: Worker<MovePayload, any, string> | undefined
let concludeWorker: Worker<ConcludePayload, unknown, string> | undefined

export const getMoveWorker = () => {
  if (moveWorker === undefined) {
    logger.info(`NODE_ENV: ${process.env.NODE_ENV ?? 'unknown'}`)
    if (process.env.NODE_ENV === 'test') {
      moveWorker = new Worker<MovePayload>('moveQueue', async (job) => {
        return await processMove(job.data)
      }, opt)
    } else {
      const ext = process.env.NODE_ENV === 'development' ? 'ts' : 'js'
      const p = path.join(__dirname, `sandboxedProcessor.${ext}`)
      moveWorker = new Worker<MovePayload>('moveQueue', p, opt)
    }
  }
  return moveWorker
}

export const getConcludeWorker = () => {
  if (concludeWorker === undefined) {
    concludeWorker = new Worker<ConcludePayload>('concludeQueue',
      async ({ data }) => await processConclude(data),
      opt)
  }
  return concludeWorker
}
