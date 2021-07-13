import { Router } from 'express'
import { TicTacToeGame } from './TicTacToeGame'
import GameError from '../libs/GameError'
import { withHandleGameError } from './withHandleGameError'

const toGradeQueue = []

const ticTacToeRouter = Router()

ticTacToeRouter.post('/rfg', (req, res) => {
  const { gradeId, endpoint } = req.body
  if(typeof gradeId === 'string' && typeof endpoint === 'string') {
    toGradeQueue.push({gradeId, endpoint})
    res.send({result: 'ok'})
  } else {
    res.send({error: 'missing gradeId or endpoint'})
  }
})

ticTacToeRouter.get('/start', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const game = new TicTacToeGame(res)

  // If client closes connection, stop sending events
  res.on('close', () => {
    game.destroy()
  })

  setTimeout(() => {
    game.destroy()
  }, 1000 * 60 * 10)  // clear the game after 10 min
})

ticTacToeRouter.post('/play/:id', withHandleGameError((req, res) => {
  const id = req.params.id
  const { x, y } = req.body
  if (typeof (x) !== 'number' && typeof (y) !== 'number') {
    throw new GameError(`invalid payload provided`)
  }
  const game = TicTacToeGame.getGame(id)
  game.put(game.externalPlayer, x, y)
  res.json({ message: 'accepted' })
}))

ticTacToeRouter.get('/view/:id', withHandleGameError((req, res) => {
  let id = req.params.id
  const game = TicTacToeGame.getGame(id)
  res.send(`<pre>${game.serialize()}</pre>`)
}))

ticTacToeRouter.get('/test', )

export default ticTacToeRouter
