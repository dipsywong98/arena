import { Queue, QueueScheduler, Worker } from "bullmq"
import { merge } from "ramda"
import { quoridorMoveQueue } from "../quoridor/queues"
import { QuoridorTurn } from "../quoridor/types"
import { tttMoveQueue } from "../ttt/queues"
import { TicTacToeTurn } from "../ttt/types"
import { v4 } from "uuid"
import { FLIP_TABLE } from "./constants"
import redis from "./redis"
import { Battle, Move, START_GAME } from "./types"

// default 5 minutes
export const SHOULD_START_WITHIN = parseInt(process.env.SHOULD_START_WITHIN ?? '30000')

const moveQueues: Record<string, Queue<Move<any, any>>> = {
  ttt: tttMoveQueue,
  quoridor: quoridorMoveQueue
}

const opposite = (s: string) => {
  switch (s) {
    case QuoridorTurn.FIRST: return QuoridorTurn.SECOND
    case QuoridorTurn.SECOND: return QuoridorTurn.FIRST
    case TicTacToeTurn.X: return TicTacToeTurn.O
    case TicTacToeTurn.O: return TicTacToeTurn.X
    default: return 'arena'
  }
}

export const houseKeepForGame = async (game: string) => {
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

export const housekeepForGameBattle = async (game: string, battleId: string) => {
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
        await moveQueues[game].add(moveId, move)
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
      await moveQueues[game].add(moveId, move)
      return { [battle.id]: error }
    }
  }
}

const HOUSE_KEEP_QUEUE = 'arena:housekeep'
export const houseKeepQueue = new Queue(HOUSE_KEEP_QUEUE, { connection: redis })
export const houseKeepQueueScheduler = new QueueScheduler(HOUSE_KEEP_QUEUE);
export const houseKeepQueueWorker = new Worker(HOUSE_KEEP_QUEUE,
  async ({ data: { game, battleId } }) => {
    if (battleId !== undefined) {
      return await housekeepForGameBattle(game, battleId)
    } else {
      return await houseKeepForGame(game)
    }
  }, { connection: redis }
)

if (process.env.NODE_ENV !== 'test') {
  houseKeepQueue.add('cron-ttt', { game: 'ttt' }, { repeat: { every: 60000 } })
  houseKeepQueue.add('cron-quoridor', { game: 'quoridor' }, { repeat: { every: 60000 } })
}
