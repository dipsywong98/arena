import IORedis, { Redis } from 'ioredis'
import { appConfig } from './config'

export const allRedis: Redis[] = []

export const makeRedis = (name = 'default'): Redis => {
  let redis
  if (appConfig.REDIS_TLS_URL !== undefined) {
    redis = new IORedis(appConfig.REDIS_TLS_URL, {
      tls: {
        rejectUnauthorized: false
      }
    })
  } else {
    redis = new IORedis(appConfig.REDIS_URL)
  }
  allRedis.push(redis)
  return redis
}

const redis = makeRedis()

let subRedis: Redis | undefined, scheduleRedis: Redis | undefined

export const getPubRedis = () => {
  return redis
}

export const getSubRedis = () => {
  if (subRedis === undefined) {
    subRedis = makeRedis('sub')
  }
  return subRedis
}

export const getScheduleRedis = () => {
  if (scheduleRedis === undefined) {
    scheduleRedis = makeRedis('schedule')
  }
  return scheduleRedis
}

export const clearOldKeys = async (redis: Redis, olderThanSeconds: number, pattern = '*') => {
  const keys = await redis.keys(pattern)
  const keysToDrop = (await Promise.all(keys.map(async (key) => {
    const idle = await redis.object('idletime', key)
    console.log({ key, idle, olderThanSeconds, delete: idle > olderThanSeconds })
    return { key, flag: idle > olderThanSeconds }
  }))).filter(({ flag }) => flag).map(({ key }) => key)
  await Promise.all(keysToDrop.map(async key => await redis.del(key)))
  return keysToDrop
}

export const clearAllKeys = async (redis: Redis, pattern = '*') => {
  const keys = await redis.keys(pattern)
  await Promise.all(keys.map(async key => await redis.del(key)))
  return keys
}

export default redis
