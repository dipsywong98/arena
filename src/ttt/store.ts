import { Redis } from 'ioredis'
import { Battle } from './types'

const makeId = (battleId: string) => {
  return `arena:ttt:battle:${battleId}`
}

const makeChannel = (channelName: string, battleId: string) => {
  return `areana:ttt:channel:${channelName}:${battleId}`
}

export const getBattle = async (redis: Redis, battleId: string): Promise<Battle | null> => {
  const text = await redis.get(makeId(battleId))
  if (text === null) {
    return null
  }
  return JSON.parse(text) as Battle
}

export const setBattle = async (redis: Redis, battle: Battle): Promise<void> => {
  await redis.set(makeId(battle.id), JSON.stringify(battle), 'EX', 60 * 60) // expire in 1 hour
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
