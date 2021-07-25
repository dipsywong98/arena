import { Router } from 'express'
import axios from 'axios'
import { generateBattlesForGrading } from './core'
import {
  getBattle,
  publishMessage,
  subscribeMessage
} from './store'
import { v4 } from 'uuid'
import { AppContext, isCaseType, Move, TicTacToeActionType } from './types'
import logger from '../logger'

export const makeRouter = (appContext: AppContext) => {
  const ticTacToeRouter = Router()
  ticTacToeRouter.get('/hi', (request, response) => {
    response.send({ hi: 'hi' })
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ticTacToeRouter.post('/rfg', async (req, res) => {
    const { gradeId, endpoint, caseType } = req.body
    if (typeof gradeId === 'string' && typeof endpoint === 'string') {
      const type = isCaseType(caseType) ? caseType : undefined
      const battleIds = await generateBattlesForGrading(appContext, gradeId, type)
      const errors = []
      for (const battleId of battleIds) {
        try {
          await axios.post(`${endpoint}/tic-tac-toe`, { battleId })
        } catch (e) {
          errors.push(e.message)
        }
      }
      res.send({ battleIds, errors })
    } else {
      res
        .status(400)
        .send({ error: 'missing gradeId or endpoint' })
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ticTacToeRouter.get('/start/:battleId', async (req, res) => {
    const { battleId } = req.params
    const battle = await getBattle(appContext.pubRedis, battleId)
    if (battle === null) {
      res.status(404).send({ error: 'battle not found' })
      return
    }
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    const moveId = v4()
    res.write(`data: ${JSON.stringify({ youAre: battle.externalPlayer, id: battleId })}\n\n`)

    subscribeMessage(appContext.subRedis, battleId, (message) => {
      res.write(`data: ${message}\n\n`)
    }).catch(e => {
      logger.err(e)
      res.status(500).send(e.message)
    })
    await appContext.incomingMoveQueue.add(moveId, {
      action: { type: TicTacToeActionType.START_GAME },
      battleId,
      by: battle.externalPlayer,
      id: moveId
    })
    res.on('close', () => {
      res.end()
    })
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ticTacToeRouter.post('/play/:battleId', async (req, res) => {
    const { battleId } = req.params
    const battle = await getBattle(appContext.pubRedis, battleId)
    if (battle === null) {
      res.status(404).send({ error: 'Battle not found' })
      return
    }
    const { x, y, action } = req.body
    const moveId = v4()
    const move: Move = {
      id: moveId,
      battleId,
      action: { type: action, x, y },
      by: battle.externalPlayer
    }
    appContext.incomingMoveQueue.add(moveId, move)
      .then(() =>
        publishMessage(
          appContext.pubRedis,
          battleId,
          {
            player: battle.externalPlayer,
            action,
            x,
            y
          })
      )
      .then(() => {
        res.json({ message: 'received your command', moveId })
      })
      .catch((e) => {
        logger.err(e)
        res.status(500).json({ message: 'rejected your command', moveId })
      })
  })

  ticTacToeRouter.get('/view/:id', (req, res) => {
    const id = req.params.id
    getBattle(appContext.pubRedis, id).then(game => {
      res.json(game)
    })
  })

  ticTacToeRouter.post('/', (req, res) => {
    res.send('OK')
  })

  return ticTacToeRouter
}
