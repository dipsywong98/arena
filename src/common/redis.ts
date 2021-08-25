import IORedis, { Redis } from 'ioredis'

export const allRedis: Redis[] = []

export const makeRedis = (): Redis => {
  if (process.env.REDIS_TLS_URL !== undefined) {
    const redis = new IORedis(process.env.REDIS_TLS_URL, {
      tls: {
        rejectUnauthorized: false
      }
    })
    allRedis.push(redis)
    return redis
  }
  const redis = new IORedis(process.env.REDIS_URL)
  allRedis.push(redis)
  return redis
}

const redis = makeRedis()

let pubRedis: Redis | undefined, subRedis: Redis | undefined

export const getPubRedis = () => {
  if (pubRedis === undefined) {
    pubRedis = makeRedis()
  }
  return pubRedis
}

export const getSubRedis = () => {
  if (subRedis === undefined) {
    subRedis = makeRedis()
  }
  return subRedis
}

export default redis
