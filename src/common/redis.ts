import IORedis, { Redis } from 'ioredis'

export const allRedis: Redis[] = []

export const makeRedis = (name = 'default'): Redis => {
  let redis
  if (process.env.REDIS_TLS_URL !== undefined) {
    redis = new IORedis(process.env.REDIS_TLS_URL, {
      tls: {
        rejectUnauthorized: false
      }
    })
  } else {
    redis = new IORedis(process.env.REDIS_URL)
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

export const opt = {
  prefix: 'Workers',
  createClient: function (type: string) {
    switch (type) {
      case 'client':
        return redis
      case 'subscriber':
        return getSubRedis()
      default:
        return makeRedis('unknown')
    }
  }
}

export default redis
