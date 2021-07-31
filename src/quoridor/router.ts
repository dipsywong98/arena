import { Router } from 'express'
import {
  getBattle,
  publishMessage,
  setBattle,
  subscribeMessage,
  timerRead,
  timerReset
} from './store'
import { v4 } from 'uuid'
import { ActionType, Move } from './types'
import logger from '../common/logger'
import redis, { pubRedis, subRedis } from '../common/redis'
import { quoridorMoveQueue } from './queues'
import { processEvaluate } from './processEvaluate'
import { TURN_ADD_MS } from './config'
import { isEvaluatePayload } from '../common/types'

const quoridorRouter = Router()
quoridorRouter.get('/hi', (request, response) => {
  response.send({ hi: 'hi' })
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
quoridorRouter.post('/evaluate', async (req, res) => {
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
quoridorRouter.get('/start/:battleId', async (req, res) => {
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

  await subscribeMessage(subRedis, battleId, (message) => {
    try{
      const { action2, ...rest } = JSON.parse(message)
      res.write(`data: ${JSON.stringify(rest)}\n\n`)
      if (action2 !== undefined) {
        res.write(`data: ${JSON.stringify(action2)}\n\n`)
      }
      // this timerReset is ok because even
      //   if this message is published by player sending move to us
      // player should not send another move to us immediately
      // so next time the player send us move and we stop timer to get the elapsed time
      // arena should have already reset the timer
      timerReset(redis, battleId)
    } catch (e) {
      logger.err(e)
    }
  })
  await quoridorMoveQueue.add(moveId, {
    action: { type: ActionType.START_GAME },
    battleId,
    by: battle.externalPlayer,
    id: moveId,
    elapsed: 0
  })
  res.on('close', () => {
    res.end()
  })
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
quoridorRouter.post('/play/:battleId', async (req, res) => {
  const { battleId } = req.params
  const elapsed = await timerRead(redis, battleId)
  const battle = await getBattle(pubRedis, battleId)
  if (battle === null) {
    res.status(404).send({ error: 'Battle not found' })
    return
  }
  if (battle.clock - elapsed < 0) {
    battle.clock -= elapsed
  } else {
    battle.clock -= elapsed
    battle.clock += TURN_ADD_MS
  }
  await setBattle(redis, battle)
  const { x, y, action } = req.body
  const moveId = v4()
  const move: Move = {
    id: moveId,
    battleId,
    action: { type: action, x, y },
    by: battle.externalPlayer,
    elapsed
  }
  await quoridorMoveQueue.add(moveId, move)
  await publishMessage(
    pubRedis,
    battleId,
    {
      player: battle.externalPlayer,
      action,
      x,
      y
    })

  res.json({ message: 'received your command', moveId, clock: battle.clock })
})

quoridorRouter.get('/view/:id', (req, res) => {
  const id = req.params.id
  getBattle(pubRedis, id).then(game => {
    res.json(game)
  })
})

quoridorRouter.post('/', (req, res) => {
  res.send('OK')
})

quoridorRouter.get('/', (req, res) => {
  res.redirect('/')
})

export default quoridorRouter
