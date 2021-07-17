import Redis from 'ioredis'

export const makeRedis = () => {
  return new Redis({
    host: process.env.REDIS_URL,
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379')
  })
}
