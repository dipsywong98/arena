import { Router } from 'express'
import { RequestHandler } from 'express-serve-static-core'
import { TicTacToeGame } from './TicTacToeGame'
import GameError from '../libs/GameError'

const ticTacToeRouter = Router()

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

const withHandleGameError = (f: RequestHandler): RequestHandler => (req, res, next) => {
  try {
    f(req, res, next)
  } catch (e) {
    if (e.name === GameError.name) {
      res.status(400).json({
        error: e.message
      })
    } else {
      res.status(500).json({
        error: e.message
      })
    }
  }
}

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

ticTacToeRouter.get('/test', (req, res) => {
  const endpoint = req.originalUrl.replace('/test', '/start')
  console.log(endpoint)
  res.send('end')
})

// ticTacToeRouter.use((err, req, res) => {
//   if(err.name){
//     console.log(err)
//   }
// })

export default ticTacToeRouter
