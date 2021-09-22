import { Queue, Worker } from 'bullmq'
import path from 'path'
import redis from '../common/redis'
import { appConfig } from './config'
import logger from './logger'
import { processConclude } from './processConclude'
import { processMove } from './processMove'
import { ConcludePayload, MovePayload } from './types'

let moveQueue: Queue<MovePayload, any, string> | undefined
let concludeQueue: Queue<ConcludePayload, any, string> | undefined

export const getMoveQueue = () => {
  if (moveQueue === undefined) {
    moveQueue = new Queue<MovePayload>('moveQueue', { connection: redis })
  }
  return moveQueue
}

export const getConcludeQueue = () => {
  if (concludeQueue === undefined) {
    concludeQueue = new Queue<ConcludePayload>('concludeQueue', { connection: redis })
  }
  return concludeQueue
}

let moveWorker: Worker<MovePayload, any, string> | undefined
let concludeWorker: Worker<ConcludePayload, unknown, string> | undefined
const concurrency: number = appConfig.CONCURRENCY

export const getMoveWorker = () => {
  if (moveWorker === undefined) {
    logger.info(`NODE_ENV: ${appConfig.NODE_ENV}`)
    if (appConfig.NODE_ENV === 'test') {
      moveWorker = new Worker<MovePayload>('moveQueue', async (job) => {
        return await processMove(job.data)
      }, { connection: redis })
    } else {
      const ext = appConfig.NODE_ENV === 'development' ? 'ts' : 'js'
      const p = path.join(__dirname, `sandboxedProcessor.${ext}`)
      moveWorker = new Worker<MovePayload>('moveQueue', p, { connection: redis, concurrency })
    }
  }
  return moveWorker
}

export const getConcludeWorker = () => {
  if (concludeWorker === undefined) {
    concludeWorker = new Worker<ConcludePayload>('concludeQueue',
      async ({ data }) => await processConclude(data),
      { connection: redis })
  }
  return concludeWorker
}
