import Redis from 'ioredis'

export const makeRedis = () => {
  return new Redis(process.env.REDIS_TLS_URL ?? process.env.REDIS_URL)
}
