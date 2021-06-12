import { Response } from 'express'
import { v4 } from 'uuid'
import agent from './agent'
import GameError from '../libs/GameError'
import { flip, Turn } from './utils'


export class TicTacToeGame {
  private static games: Record<string, TicTacToeGame> = {}
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

  static getGame (id: string) {
    if (!(id in this.games)) {
      throw new GameError(`No game with id ${id}`)
    }
    return this.games[id]
  }

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
    TicTacToeGame.games[this._id] = this
    this.send({ youAre: this._externalPlayer, id: this._id })
    if(this._externalPlayer === 'X') {
      this.aiMove()
    }
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
      this.aiMove()
    }
  }

  public aiMove() {
    const aiTurn = flip(this._externalPlayer)
    if (this._turn === aiTurn) {
      const move = agent({ board: this._board, turn: this._turn })
      if (move) {
        this.put(aiTurn, move[0], move[1])
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
    delete TicTacToeGame.games[this._id]
    this._res?.end()
  }
}
