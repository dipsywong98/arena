import { Router } from 'express'
import { AppContext, Move } from './common'
import axios from 'axios'
import { generateBattlesForGrading } from './core'
import { getBattle, publishMove, subscribeMove } from './store'
import { withHandleGameError } from '../tic-tac-toe/withHandleGameError'
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
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    const state = battle.history[0]
    res.write(`data: ${JSON.stringify({ youAre: state.externalPlayer, id: battleId })}\n\n`)

    subscribeMove(appContext.subRedis, battleId, (move) => {
      res.write(`data: ${JSON.stringify(move.action)}\n\n`)
    }).catch(e => {
      console.error(e)
      res.status(500).send(e.message)
    })
  })

  ticTacToeRouter.post('/play/:battleId', withHandleGameError((req, res) => {
    const { battleId } = req.params
    const { x, y, action } = req.body
    const moveId = v4()
    const move: Move = { id: moveId, battleId, action: { x, y, action } }
    appContext.moveQueue.add(moveId, move)
      .then(() =>
        publishMove(appContext.pubRedis, battleId, move)
      )
      .then(() => {
        res.json({ message: 'received your command', moveId })
      })
      .catch((e) => {
        console.error(e)
        res.status(500).json({ message: 'rejected your command', moveId })
      })
  }))

  ticTacToeRouter.get('/view/:id', withHandleGameError((req, res) => {
    let id = req.params.id
    const game = getBattle(appContext.pubRedis, id)
    res.send(`<pre>${JSON.stringify(game, null, 2)}</pre>`)
  }))

  ticTacToeRouter.post('/', (req,res) => {
    console.log('/')
    res.send('OK')
  })

  return ticTacToeRouter
}
