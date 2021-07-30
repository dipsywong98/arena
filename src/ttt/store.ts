import { Redis } from 'ioredis'
import { Battle, Run } from './types'

const makeRedisBattleId = (battleId: string) => {
  return `arena:ttt:battle:${battleId}`
}

const makeRedisRunId = (runId: string) => {
  return `arena:ttt:run:${runId}`
}

const makeChannel = (channelName: string, battleId: string) => {
  return `areana:ttt:channel:${channelName}:${battleId}`
}

const makeRedisTimerKey = (battleId: string) => {
  return `arena:ttt:timer:${battleId}`
}

export const getBattle = async (redis: Redis, battleId: string): Promise<Battle | null> => {
  const text = await redis.get(makeRedisBattleId(battleId))
  if (text === null) {
    return null
  }
  return JSON.parse(text) as Battle
}

export const setBattle = async (redis: Redis, battle: Battle): Promise<void> => {
  await redis.set(
    makeRedisBattleId(battle.id),
    JSON.stringify(battle),
    'EX',
    60 * 60
  ) // expire in 1 hour
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
  await redis.set(makeRedisRunId(run.id), JSON.stringify(run), 'EX', 60 * 60) // expire in 1 hour
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

export const timerRead = async (redis: Redis, battleId: string) => {
  const now = Date.now()
  const string = await redis.get(makeRedisTimerKey(battleId))
  if (string === null) {
    return 0
  } else {
    return now - Number(string)
  }
}
