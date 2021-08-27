import { Redis } from 'ioredis'
import { QuoridorBattle } from './types'
import { Run } from '../common/types'

const makeRedisBattleId = (battleId: string) => {
  return `arena:quoridor:battle:${battleId}`
}

const makeRedisRunId = (runId: string) => {
  return `arena:quoridor:run:${runId}`
}

const makeChannel = (channelName: string, battleId: string) => {
  return `areana:quoridor:channel:${channelName}:${battleId}`
}

const makeRedisTimerKey = (battleId: string) => {
  return `arena:quoridor:timer:${battleId}`
}

const makeRedisLockId = (battleId: string) => {
  return `arena:quoridor:lock:${battleId}`
}

export const getBattle = async (redis: Redis, battleId: string): Promise<QuoridorBattle | null> => {
  const text = await redis.get(makeRedisBattleId(battleId))
  if (text === null) {
    return null
  }
  return JSON.parse(text) as QuoridorBattle
}

export const setBattle = async (redis: Redis, battle: QuoridorBattle): Promise<void> => {
  await redis.set(
    makeRedisBattleId(battle.id),
    JSON.stringify(battle),
  )
}

export const getRun = async (redis: Redis,
  runId: string): Promise<Run | null> => {
  const text = await redis.get(makeRedisRunId(runId))
  if (text === null) {
    return null
  }
  return JSON.parse(text) as Run
}

export const setRun = async (redis: Redis, run: Run): Promise<void> => {
  await redis.set(makeRedisRunId(run.id), JSON.stringify(run))
}

export const publishMessage = async (
  redis: Redis,
  battleId: string,
  message: Record<string, unknown>
) => {
  await redis.publish(makeChannel('publish', battleId), JSON.stringify(message))
}

export const subscribeMessage = async (
  redis: Redis,
  battleId: string,
  callback: (message: string) => void | Promise<void>
) => {
  await redis.subscribe(makeChannel('publish', battleId))
  redis.on('message', (channel, message) => {
    if (channel === makeChannel('publish', battleId)) {
      callback(message)
    }
  })
}

export const timerReset = async (redis: Redis, battleId: string) => {
  await redis.set(makeRedisTimerKey(battleId), Date.now())
}

export const timerReadAndClear = async (redis: Redis, battleId: string) => {
  const now = Date.now()
  const string = await redis.get(makeRedisTimerKey(battleId))
  await redis.del(makeRedisTimerKey(battleId))
  if (string === null) {
    return 0
  } else {
    return now - Number(string)
  }
}

export const checkAndLockBattle = async (redis: Redis, battleId: string) => {
  return await redis.getset(makeRedisLockId(battleId), 'true')
}

export const unlockBattle = async (redis: Redis, battleId: string) => {
  await redis.del(makeRedisLockId(battleId))
}
