import { Response, Router } from 'express'
import { v4 } from 'uuid'
import agent from './agent'
import { RequestHandler } from 'express-serve-static-core'

const ticTacToeRouter = Router()

const games: Record<string, TicTacToeGame> = {}

class GameError implements Error {
  message: string
  name: string = 'GameError'

  constructor (message: string) {
    this.message = message
  }
}

export type Turn = 'X' | 'O'

export const flip = (turn: Turn) => turn === 'X' ? 'O' : 'X'

export class TicTacToeGame {
  private _id = ''
  private _createdAt = 0
  private _turn: Turn = 'O'
  private _board: Array<Array<Turn | null>> = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ]
  private _res?: Response
  private _externalPlayer: Turn = 'O'

  get id (): string {
    return this._id
  }

  get createdAt (): number {
    return this._createdAt
  }

  get turn (): Turn {
    return this._turn
  }

  get board (): any[][] {
    return this._board
  }

  get res (): Response | undefined {
    return this._res
  }

  get externalPlayer (): Turn {
    return this._externalPlayer
  }

  constructor (res?: Response) {
    this._res = res
    this._createdAt = Date.now()
    this._id = v4()
    this._externalPlayer = Math.random() > 0.5 ? 'O' : 'X'
    this.send({ youAre: this._externalPlayer, id: this._id })
  }

  private send (data: unknown) {
    this._res?.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  public put (player: Turn, x: number, y: number) {
    if (this._board[y][x] !== null) {
      throw new GameError(`${x}, ${y} already occupied`)
    }
    if (player !== this._turn) {
      throw new GameError(`Not your turn`)
    }
    this._board[y][x] = player
    this._turn = flip(this._turn)
    this.send({ player, x, y })
    if (player === this._externalPlayer) {
      const move = agent({ board: this._board, turn: this._turn })
      if (move) {
        this.put(this._turn, move[0], move[1])
      } else {
        this.surrender(this._turn)
      }
    }
  }

  public serialize (): string {
    return this._board.map(
      row => row.map(s => s ?? ' ').join('')
    ).join('\n')
  }

  public surrender (player: Turn) {
    this.send({ player, surrender: true })
    this.destroy()
  }

  public destroy () {
    delete games[this._id]
    this._res?.end()
  }
}

ticTacToeRouter.get('/start', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const game = new TicTacToeGame(res)
  games[game.id] = game

  // If client closes connection, stop sending events
  res.on('close', () => {
    game.destroy()
  })

  setTimeout(() => {
    delete games[game.id]
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
  if (!(id in games)) {
    throw new GameError(`No game with id ${id}`)
  } else {
    if (typeof (x) !== 'number' && typeof (y) !== 'number') {
      throw new GameError(`invalid payload provided`)
    }
    const game = games[id]
    game.put(game.externalPlayer, x, y)
  }
  res.json({ message: 'accepted' })
}))

ticTacToeRouter.get('/view/:id', withHandleGameError((req, res) => {
  let id = req.params.id
  if (!(id in games)) {
    throw new GameError(`No game with id ${id}`)
  } else {
    res.send(`<pre>${games[id].serialize()}</pre>`)
  }
}))

// ticTacToeRouter.use((err, req, res) => {
//   if(err.name){
//     console.log(err)
//   }
// })

export default ticTacToeRouter
