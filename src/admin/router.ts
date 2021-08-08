import { Router } from 'express'
import { Run } from '../common/types'
import redis from '../common/redis'
import { arenaUrl } from '../common/constants'

const adminRouter = Router()

const getRun = async (game: string, runId: string): Promise<unknown> => {
  const j = await redis.get(`arena:${game}:run:${runId}`)
  if (j) {
    const run: Run = JSON.parse(j)
    return {
      ...run,
      battleUrls: run.battleIds.map(id => `${arenaUrl}/tic-tac-toe/admin/view/${id}`)
    }
  }
  return j
}

adminRouter.get('/:game/runs/:runId', (req, res) => {
  const { game, runId } = req.params
  getRun(game === 'tic-tac-toe' ? 'ttt' : game, runId).then(j => res.json(j))
})

export default adminRouter
