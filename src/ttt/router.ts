import { Router } from 'express'
import {
  getBattle,
  checkAndLockBattle,
  publishMessage,
  setBattle,
  subscribeMessage,
  timerReadAndClear,
  timerReset,
  getRun
} from './store'
import { v4 } from 'uuid'
import { TicTacToeActionType, TicTacToeMove } from './types'
import logger from '../common/logger'
import redis, { getPubRedis, getSubRedis } from '../common/redis'
import { processEvaluate } from './processEvaluate'
import { TURN_ADD_MS } from './config'
import { Game, isEvaluatePayload } from '../common/types'
import { candidate } from './candidate'
import { processMove } from './processMove'
import { getMoveQueue } from '../common/queues'
import { appConfig } from '../common/config'
import { FLIP_TABLE } from '../common/constants'

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
ticTacToeRouter.post('/tryout', async (req, res) => {
  const payload = req.body
  const runId = v4()
  payload.runId = runId
  payload.callbackUrl = `http://localhost:${appConfig.PORT}`
  if (isEvaluatePayload(payload)) {
    const { errors } = await processEvaluate(payload)
    res.send({ resultUrl: `${appConfig.APP_URL}/tic-tac-toe/result/${runId}`, errors })
  } else {
    res
      .status(400)
      .send({ error: 'missing teamUrl' })
  }
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ticTacToeRouter.get('/result/:runId', async (req, res) => {
  const runId = req.params.runId
  const run = await getRun(redis, runId)
  if (run) {
    res.json(run.message ?? {message: 'no result yet'})
  } else {
    res.sendStatus(404)
  }
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ticTacToeRouter.get('/start/:battleId', async (req, res) => {
  const { battleId } = req.params
  logger.info(`[ttt-start:${battleId}]: headers: ${
    JSON.stringify(req.headers)}`)
  const battle = await getBattle(getPubRedis(), battleId)
  if (battle === null) {
    res.status(404).send({ error: 'battle not found' })
    return
  }
  // res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const moveId = v4()
  let ended = false
  const logAndWrite = (str: string) => {
    if (!ended) {
      logger.info(`[ttt-event-stream:${battleId}] ${str}`)
      res.write(`data: ${str}\n\n`)
    }
  }
  logAndWrite(JSON.stringify({ youAre: battle.externalPlayer, id: battleId }))

  await subscribeMessage(getSubRedis(), battleId, async (message) => {
    try {
      // this timerReset is ok because even
      //   if this message is published by player sending move to us
      // player should not send another move to us immediately
      // so next time the player send us move and we stop timer to get the elapsed time
      // arena should have already reset the timer
      timerReset(redis, battleId)
      const { action2, ...rest } = JSON.parse(message)
      logAndWrite(JSON.stringify(rest))
      if (action2 !== undefined) {
        logAndWrite(JSON.stringify(action2))
      }
      if (rest.winner || rest.action === FLIP_TABLE) {
        const battle = await getBattle(getPubRedis(), battleId)
        if (battle?.result) {
          ended = true
          res.end()
        }
      }
    } catch (e) {
      logger.err(e)
    }
  })
  processMove({
    action: { action: TicTacToeActionType.START_GAME },
    battleId,
    by: battle.externalPlayer,
    id: moveId,
    elapsed: 0
  })
  res.on('close', () => {
    ended = true
    res.end()
  })
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ticTacToeRouter.post('/play/:battleId', async (req, res) => {
  const { battleId } = req.params
  logger.info(`[ttt-play:${battleId}]: headers: ${
    JSON.stringify(req.headers)} body: ${JSON.stringify(req.body)}`)
  const elapsed = await timerReadAndClear(redis, battleId)
  const battle = await getBattle(getPubRedis(), battleId)
  if (battle === null) {
    res.status(404).send({ error: 'Battle not found' })
    return
  }
  if (battle.result) {
    res.status(423).send({ error: 'Battle already ended' })
    return
  }
  if (battle.clock - elapsed < 0) {
    battle.clock -= elapsed
  } else {
    battle.clock -= elapsed
    battle.clock += TURN_ADD_MS
  }
  await setBattle(redis, battle)
  const action = req.body
  await publishMessage(
    getPubRedis(),
    battleId,
    {
      player: battle.externalPlayer,
      ...action,
    })
  const moveId = v4()
  const error = (
    await checkAndLockBattle(redis, battle.id)
      ? 'send move before arena replies'
      : undefined)
  await checkAndLockBattle(redis, battleId)
  const move: TicTacToeMove = {
    id: moveId,
    battleId,
    action,
    by: battle.externalPlayer,
    elapsed,
    error
  }
  if (error === undefined) {
    getMoveQueue().add(moveId, { game: Game.TTT, move });
  } else {
    processMove(move)
  }

  res.json({ message: 'received your command', moveId, clock: battle.clock })
})

ticTacToeRouter.get('/admin/view/:id', (req, res) => {
  const id = req.params.id
  getBattle(getPubRedis(), id).then(game => {
    res.json(game)
  })
})

ticTacToeRouter.post('/', (req, res) => {
  if (appConfig.CANDIDATE_ENABLED) {
    res.send('OK')
    candidate(req.body.battleId)
  } else {
    res.send('OK')
  }
})

ticTacToeRouter.get('/', (req, res) => {
  res.redirect('/')
})

export default ticTacToeRouter
