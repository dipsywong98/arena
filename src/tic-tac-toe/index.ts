import { Router } from 'express'
import { RequestHandler } from 'express-serve-static-core'
import { TicTacToeGame } from './TicTacToeGame'
import GameError from '../libs/GameError'
import http from 'http'
import agent, { TicTacToeState } from './agent'
import { Turn } from './utils'
import axios from 'axios'

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
  const getEndpoint = (route: string): string => req.protocol + '://' + req.get('host') + req.originalUrl.replace('/test', route)
  http.get(getEndpoint('/start'), (res) => {
    let id: string
    let state: TicTacToeState
    let me: Turn
    let first = false
    res.on('data', data => {
      let text = new TextDecoder('utf-8').decode(data)
      const message = JSON.parse(text.replace('data: ', ''))
      console.log(text)
      if ('id' in message) {
        id = message.id
      }
      if ('youAre' in message) {
        me = message.youAre
        first = message.youAre === 'O'
        state = {
          board: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
          ],
          turn: 'O'
        }
      }
      if (('player' in message && 'x' in message && 'y' in message && message.player !== me) || first) {
        if(!first) {
          state.board[message.y][message.x] = message.player
        }
        if(message.player !== me || first) {
          state.turn = me
          const move = agent(state)
          if (move) {
            console.log(state)
            console.log(`move ${move[0]} ${move[1]}`)
            state.board[move[1]][move[0]] = me
            axios.post(getEndpoint(`/play/${id}`), {x: move[0], y: move[1]})
              .catch((error) => {
                console.error('error', error.response.body)
              })
          }
        }
        first = false
      }
    })
  })
  res.send('end')
})

// ticTacToeRouter.use((err, req, res) => {
//   if(err.name){
//     console.log(err)
//   }
// })

export default ticTacToeRouter
