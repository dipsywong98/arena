import { Router } from 'express'
import { Run } from '../common/types'
import redis from '../common/redis'
import { arenaUrl } from '../common/constants'
import { getBattle as getTTTBattle } from '../ttt/store'
import { getBattle as getQBattle } from '../quoridor/store'
import { Redis } from 'ioredis'

interface Helper {
  getBattle: (redis: Redis, battleId: string) => Promise<unknown>
}

const helper: Record<string, Helper> = {
  quoridor: { getBattle: getQBattle },
  ttt: { getBattle: getTTTBattle }
}

const adminRouter = Router()

const getRun = async (game: string, runId: string): Promise<unknown> => {
  const j = await redis.get(`arena:${game}:run:${runId}`)
  if (j) {
    const run: Run = JSON.parse(j)
    return {
      ...run,
      battleUrls: run.battleIds.map(id => `${arenaUrl}/admin/${game}/view/${id}`)
    }
  }
  return j
}

const getRuns = async (game: string) => {
  const ids = await redis.keys(`arena:${game}:run:*`)
  const runs = (await Promise.all(ids.map(async id => await redis.get(id))))
    .filter((f: string | null) => f !== null) as string[]
  return runs.map((f: string) => JSON.parse(f) as Run)
    .map((f) => ({
      id: f.id,
      score: f.score,
      createdAt: f.createdAt,
      callbackUrl: f.callbackUrl,
      link: `${arenaUrl}/admin/${game}/runs/${f.id}`
    }))
}

adminRouter.get('/:game/runs', (req, res) => {
  const { game } = req.params
  getRuns(game).then(j => res.json(j))
})

adminRouter.get('/:game/runs/:runId', (req, res) => {
  const { game, runId } = req.params
  getRun(game === 'tic-tac-toe' ? 'ttt' : game, runId).then(j => res.json(j))
})

adminRouter.get('/:game/view/:id', (req, res) => {
  const { id, game } = req.params
  if (game in helper) {
    helper[game].getBattle(redis, id).then(game => {
      res.json(game)
    })
  } else {
    res.json([game, 'not in', Object.keys(helper)])
  }
})

export default adminRouter
