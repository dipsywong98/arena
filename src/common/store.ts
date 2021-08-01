import { Redis } from 'ioredis'
import { Action, Battle, ChallengeContext, Move, Run, State } from './types'

export const makeStore = <A extends Action,
  B extends Battle<CaseType,Result,S,Turn>,
  CaseType extends string,
  M extends Move<A, Turn>,
  Result,
  S extends State,
  Turn,
  Ctx extends ChallengeContext<A,B,CaseType, M, Result, S, Turn>
  >
(ctx: Ctx): Ctx => {
  const { prefix } = ctx
  const makeRedisBattleId = (battleId: string) => {
    return `arena:${prefix}:battle:${battleId}`
  }

  const makeRedisRunId = (runId: string) => {
    return `arena:${prefix}:run:${runId}`
  }

  const makeChannel = (channelName: string, battleId: string) => {
    return `areana:${prefix}:channel:${channelName}:${battleId}`
  }

  const makeRedisTimerKey = (battleId: string) => {
    return `arena:${prefix}:timer:${battleId}`
  }

  const getBattle = async (redis: Redis, battleId: string): Promise<B | null> => {
    const text = await redis.get(makeRedisBattleId(battleId))
    if (text === null) {
      return null
    }
    return JSON.parse(text) as B
  }

  const setBattle = async (redis: Redis, battle: B): Promise<void> => {
    await redis.set(
      makeRedisBattleId(battle.id),
      JSON.stringify(battle),
      'EX',
      60 * 60
    ) // expire in 1 hour
  }

  const getRun = async (redis: Redis,
                        runId: string): Promise<Run | null> => {
    const text = await redis.get(makeRedisRunId(runId))
    if (text === null) {
      return null
    }
    return JSON.parse(text) as Run
  }

  const setRun = async (redis: Redis, run: Run): Promise<void> => {
    await redis.set(makeRedisRunId(run.id), JSON.stringify(run), 'EX', 60 * 60) // expire in 1 hour
  }

  const publishMessage = async (
    redis: Redis,
    battleId: string,
    message: Record<string, unknown>
  ) => {
    await redis.publish(makeChannel('publish', battleId), JSON.stringify(message))
  }

  const subscribeMessage = async (
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

  const timerReset = async (redis: Redis, battleId: string) => {
    await redis.set(makeRedisTimerKey(battleId), Date.now())
  }

  const timerRead = async (redis: Redis, battleId: string) => {
    const now = Date.now()
    const string = await redis.get(makeRedisTimerKey(battleId))
    if (string === null) {
      return 0
    } else {
      return now - Number(string)
    }
  }

  return {
    ...ctx,
    stores: {
      getBattle,
      setBattle,
      getRun,
      setRun,
      publishMessage,
      subscribeMessage,
      timerReset,
      timerRead
    }
  }
}
