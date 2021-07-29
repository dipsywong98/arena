import { Router } from 'express'
import { getBattle, publishMessage, subscribeMessage } from './store'
import { v4 } from 'uuid'
import { isEvaluatePayload, Move, TicTacToeActionType } from './types'
import logger from '../logger'
import { pubRedis, subRedis } from '../redis'
import { moveQueue } from './queues'
import { processEvaluate } from './processEvaluate'

const ticTacToeRouter = Router()
ticTacToeRouter.get('/hi', (request, response) => {
  response.send({ hi: 'hi' })
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ticTacToeRouter.post('/evaluate', async (req, res) => {
  const payload = req.body
  if (isEvaluatePayload(payload)) {
    const { battleIds, errors } = await processEvaluate(payload)
    res.send({ battleIds, errors })
  } else {
    res
      .status(400)
      .send({ error: 'missing runId, callbackUrl or teamUrl' })
  }
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ticTacToeRouter.get('/start/:battleId', async (req, res) => {
  const { battleId } = req.params
  const battle = await getBattle(pubRedis, battleId)
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

  subscribeMessage(subRedis, battleId, (message) => {
    const { action2, ...rest } = JSON.parse(message)
    res.write(`data: ${JSON.stringify(rest)}\n\n`)
    if (action2 !== undefined) {
      res.write(`data: ${JSON.stringify(action2)}\n\n`)
    }
  }).catch(e => {
    logger.err(e)
    res.status(500).send(e.message)
  })
  await moveQueue.add(moveId, {
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
  const battle = await getBattle(pubRedis, battleId)
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
  moveQueue.add(moveId, move)
    .then(() =>
      publishMessage(
        pubRedis,
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
  getBattle(pubRedis, id).then(game => {
    res.json(game)
  })
})

ticTacToeRouter.post('/', (req, res) => {
  res.send('OK')
})

ticTacToeRouter.get('/', (req, res) => {
  res.redirect('/')
})

export default ticTacToeRouter
