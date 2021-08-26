import { Queue, QueueScheduler, Worker } from "bullmq"
import { merge } from "ramda"
import { QuoridorTurn } from "../quoridor/types"
import { TicTacToeTurn } from "../ttt/types"
import { v4 } from "uuid"
import { FLIP_TABLE } from "./constants"
import redis, { opt } from "./redis"
import { Battle, Game, Move, START_GAME } from "./types"
import { getMoveQueue } from "./queues"

// default 5 minutes
export const SHOULD_START_WITHIN = parseInt(process.env.SHOULD_START_WITHIN ?? '300000')

const opposite = (s: string) => {
  switch (s) {
    case QuoridorTurn.FIRST: return QuoridorTurn.SECOND
    case QuoridorTurn.SECOND: return QuoridorTurn.FIRST
    case TicTacToeTurn.X: return TicTacToeTurn.O
    case TicTacToeTurn.O: return TicTacToeTurn.X
    default: return 'arena'
  }
}

export const houseKeepForGame = async (game: Game) => {
  const battleKeys = await redis.keys(`arena:${game}:battle:*`)
  const battles: Array<Battle<any, any, any, any>> = (
    (await Promise.all(battleKeys.map(async battleKey => await redis.get(battleKey))))
      .filter((str: string | null) => str !== null)
      .map((s) => JSON.parse(s as string) as Battle<any, any, any, any>)
  )
  const results = await Promise.all(battles.map(async battle => {
    return await housekeepForGameBattle(game, battle.id)
  }))
  return merge(results.filter(r => r !== null))
}

export const housekeepForGameBattle = async (game: Game, battleId: string) => {
  const battleStr = await redis.get(`arena:${game}:battle:${battleId}`)
  const now = Date.now()
  if (battleStr !== null) {
    const battle: Battle<any, any, any, any> = JSON.parse(battleStr)
    if (battle.result !== undefined) {
      return
    }
    const { createdAt, clock } = battle
    if (battle.history.length === 1) {
      if (now - createdAt >= SHOULD_START_WITHIN) {
        const moveId = v4()
        const error = `didnt start game with ${SHOULD_START_WITHIN}`
        const move: Move<any, any> = {
          id: moveId,
          battleId: battle.id,
          action: { action: START_GAME },
          by: opposite(battle.externalPlayer),
          elapsed: 0,
          error
        }
        await getMoveQueue().add(moveId, { game, move })
        return { [battle.id]: error }
      }
    }
    const timer = await redis.get(`arena:${game}:timer:${battle.id}`)
    let elapsed = 0
    if (timer !== null) {
      elapsed = now - parseInt(timer)
    }
    if (elapsed > clock) {
      const moveId = v4()
      const error = 'You ran out of time'
      const move: Move<any, any> = {
        id: moveId,
        battleId: battle.id,
        action: { action: FLIP_TABLE },
        by: opposite(battle.externalPlayer),
        elapsed: 0,
        error
      }
      await getMoveQueue().add(moveId, { game, move })
      return { [battle.id]: error }
    }
  }
}

const HOUSE_KEEP_QUEUE = 'arena:housekeep'
export const houseKeepQueue = new Queue(HOUSE_KEEP_QUEUE, opt)
export const houseKeepQueueScheduler = process.env.NODE_ENV !== 'test'
  ? new QueueScheduler(HOUSE_KEEP_QUEUE, opt)
  : { close: async () => await Promise.resolve() };
export const houseKeepQueueWorker = new Worker(HOUSE_KEEP_QUEUE,
  async ({ data: { game, battleId } }) => {
    if (battleId !== undefined) {
      return await housekeepForGameBattle(game, battleId)
    } else {
      return await houseKeepForGame(game)
    }
  }, opt
)

if (process.env.NODE_ENV !== 'test') {
  houseKeepQueue.add('cron-ttt', { game: 'ttt' }, { repeat: { every: 60000 } })
  houseKeepQueue.add('cron-quoridor', { game: 'quoridor' }, { repeat: { every: 60000 } })
}
