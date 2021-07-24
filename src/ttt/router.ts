import { Router } from 'express'
import { AppContext, Move, TicTacToeActionType } from './common'
import axios from 'axios'
import { generateBattlesForGrading } from './core'
import { getBattle, publishOutgoingMove, subscribeMessage, subscribeOutgoingMove } from './store'
import { withHandleGameError } from './withHandleGameError'
import { v4 } from 'uuid'

export const makeRouter = (appContext: AppContext) => {
  const ticTacToeRouter = Router()

  ticTacToeRouter.post('/rfg', async (req, res) => {
    const { gradeId, endpoint } = req.body
    if (typeof gradeId === 'string' && typeof endpoint === 'string') {
      const battleIds = await generateBattlesForGrading(appContext, gradeId)
      for (const battleId of battleIds) {
        await axios.post(`${endpoint}/tic-tac-toe`, { battleId })
      }
      res.send({ battleIds })
    } else {
      res
        .status(400)
        .send({ error: 'missing gradeId or endpoint' })
    }
  })

  ticTacToeRouter.get('/start/:battleId', async (req, res) => {
    const { battleId } = req.params
    const battle = await getBattle(appContext.pubRedis, battleId)
    if (battle === null ){
      res.status(404).send({error: 'battle not found'})
      return
    }
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    const moveId = v4()
    await appContext.incomingMoveQueue.add(moveId, { action: { type: TicTacToeActionType.START_GAME },
      battleId,
      by: battle.externalPlayer,
      id: moveId
    })
    res.write(`data: ${JSON.stringify({ youAre: battle.externalPlayer, id: battleId })}\n\n`)

    subscribeOutgoingMove(appContext.subRedis, battleId, (move) => {
      res.write(`data: ${JSON.stringify({ ...move.action, player: move.by })}\n\n`)
    }).catch(e => {
      console.error(e)
      res.status(500).send(e.message)
    })

    subscribeMessage(appContext.subRedis, battleId, (message) => {
      res.write(`data: ${message}\n\n`)
    }).catch(e => {
      console.error(e)
      res.status(500).send(e.message)
    })
  })

  ticTacToeRouter.post('/play/:battleId', withHandleGameError(async (req, res) => {
    const { battleId } = req.params
    const battle = await getBattle(appContext.pubRedis, battleId)
    if (battle === null) {
      res.status(404).send({error: 'Battle not found'})
      return
    }
    const { x, y, action } = req.body
    const moveId = v4()
    const move: Move = { id: moveId, battleId, action: { type: action, x, y }, by: battle.externalPlayer }
    appContext.incomingMoveQueue.add(moveId, move)
      .then(() =>
        publishOutgoingMove(appContext.pubRedis, move)
      )
      .then(() => {
        res.json({ message: 'received your command', moveId })
      })
      .catch((e) => {
        console.error(e)
        res.status(500).json({ message: 'rejected your command', moveId })
      })
  }))

  ticTacToeRouter.get('/view/:id', withHandleGameError(async (req, res) => {
    let id = req.params.id
    const game = await getBattle(appContext.pubRedis, id)
    res.send(`<pre>${JSON.stringify(game, null, 2)}</pre>`)
  }))

  ticTacToeRouter.post('/', (req, res) => {
    console.log('/')
    res.send('OK')
  })

  return ticTacToeRouter
}
