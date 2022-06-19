import { Router } from 'express'
import { Battle, Game, Run } from '../common/types'
import redis, { clearAllKeys, clearOldKeys } from '../common/redis'
import { ARENA_URL } from '../common/constants'
import { getBattle as getTTTBattle } from '../ttt/store'
import { getBattle as getQBattle } from '../quoridor/store'
import { getBattle as getC4Battle } from '../connect4/store'
import { Redis } from 'ioredis'
import { DateTime, Interval } from 'luxon'
import { getMoveQueue } from '../common/queues'
import { range } from 'ramda'
import { briefRun, formatBattle, formatRun } from './formatter'

interface Helper {
  getBattle: (redis: Redis, battleId: string) => Promise<Battle<any, any, any, any> | null>
}

const helper: Record<string, Helper> = {
  quoridor: { getBattle: getQBattle },
  ttt: { getBattle: getTTTBattle },
  connect4: { getBattle: getC4Battle },
}

const adminRouter = Router()

const getRun = async (game: Game, runId: string): Promise<unknown> => {
  const j = await redis.get(`arena:${game}:run:${runId}`)
  if (j) {
    const run: Run = JSON.parse(j)
    return await formatRun(game, run)
  }
  return j
}

const getRuns = async (game: Game) => {
  const ids = await redis.keys(`arena:${game}:run:*`)
  const runs = (await Promise.all(ids.map(async id => await redis.get(id))))
    .filter((f: string | null) => f !== null) as string[]
  return runs.map((f: string) => JSON.parse(f) as Run)
    .map((f) => briefRun(game, f)).sort((a, b) => b.createdAt - a.createdAt)
}

const rangeSteps = (a: number, b: number, s: number) => {
  return range(a, b).filter(k => (k - a) % s === 0)
}

const findAndCacheMove = async (jobName: string) => {
  const allKinds = ['wait', 'delayed', 'active', 'completed', 'failed']
  const queue = getMoveQueue()
  const counts = Object.values(await queue.getJobCounts(...allKinds)).reduce((a, b) => a + b, 0)
  const page = 100
  for (const a of rangeSteps(0, counts, page).reverse()) {
    const jobs = await queue.getJobs(allKinds, a, Math.min(a + page, counts))
    for (const j of jobs) {
      if (j.id) {
        redis.set(`moveid:${j.name}`, j.id)
        if (j.name === jobName) {
          return j.id
        }
      }
    }
  }
  return undefined
}

const findMove = async (jobName: string) => {
  const id = await redis.get(`moveid:${jobName}`)
  if (id) {
    return id
  }
  return await findAndCacheMove(jobName)
}

const getMoveById = async (id?: string) => {
  if (!id) {
    return null
  }
  return await getMoveQueue().getJob(id)
}

adminRouter.get('/moves/:id', (req, res) => {
  const id = req.params.id
  if (/^\d+$/.test(id)) {
    getMoveById(id).then((job) => { res.json(job) })
  } else {
    findMove(id).then(id => getMoveById(id)).then((job) => { res.json(job) })
  }
})

adminRouter.get('/:game/runs', (req, res) => {
  const { game } = req.params
  getRuns(game as Game).then(j => res.json(j))
})

adminRouter.get('/:game/runs/:runId', (req, res) => {
  const { game, runId } = req.params
  getRun(game === 'tic-tac-toe' ? Game.TTT : game as Game, runId).then(j => res.json(j))
})

adminRouter.get('/:game/battles/:id', (req, res) => {
  const { id, game } = req.params
  if (game in helper) {
    helper[game].getBattle(redis, id).then((battle: Battle<any, any, any, any> | null) => {
      if (battle) {
        res.json(formatBattle(game as Game, battle))
      } else {
        res.json(null)
      }
    })
  } else {
    res.json([game, 'not in', Object.keys(helper)])
  }
})

adminRouter.get('/redis/clear', (req, res) => {
  const { seconds: secondsParam, pattern } = req.params as any
  if (secondsParam === undefined || typeof secondsParam === 'string') {
    const seconds = Number.parseInt(secondsParam ?? '3600')
    clearOldKeys(redis, seconds, pattern).then(cleared => res.json({ seconds, cleared }))
  } else {
    res.status(409).json({ error: 'invalid seconds' })
  }
})

adminRouter.get('/redis/clearAll', (req, res) => {
  clearAllKeys(redis, req.query.pattern as string).then(cleared => {
    res.json({ cleared })
  })
})

export default adminRouter
