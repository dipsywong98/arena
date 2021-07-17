import { Battle, Move } from './common'
import { Redis } from 'ioredis'

const makeId = (battleId: string) => {
  return `arena:ttt:battle:${battleId}`
}

const makeChannel = (channelName: string, battleId: string) => {
  return `areana:ttt:channel:${channelName}:${battleId}`
}

export const getBattle = async (redis: Redis, battleId: string): Promise<Battle> => {
  const text = await redis.get(makeId(battleId))
  if (text === null) {
    throw new Error(`battle of id ${battleId} does not exist`)
  }
  return JSON.parse(text) as Battle
}

export const setBattle = async (redis: Redis, battle: Battle): Promise<void> => {
  await redis.set(makeId(battle.id), JSON.stringify(battle), 'EX', 60 * 60) // expire in 1 hour
}

export const subscribeMove = async (redis: Redis, battleId: string, callback: (move: Move) => void | Promise<void>) => {
  await redis.subscribe(makeChannel('move', battleId))
  redis.on('message', (channel, message) => {
    if (channel === makeChannel('move', battleId)) {
      callback(JSON.parse(message))
    }
  })
}

export const publishMove = async (redis: Redis, battleId: string, move: Move) => {
  await redis.publish(makeChannel('move', battleId), JSON.stringify(move))
}
