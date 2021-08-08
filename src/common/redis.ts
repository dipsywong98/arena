import IORedis, { Redis } from 'ioredis'

export const allRedis: Redis[] = []

export const makeRedis = (): Redis => {
  const redis = new IORedis(process.env.REDIS_TLS_URL ?? process.env.REDIS_URL, {
    tls: {
      rejectUnauthorized: false
    }
  })
  allRedis.push(redis)
  return redis
}

const redis = makeRedis()

export const pubRedis = makeRedis()
export const subRedis = makeRedis()

export default redis
