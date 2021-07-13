import { TicTacToeGame } from './index'
import alphaBetaTreeAgent from './agent'

describe('agent', () => {
  it('test', () => {
    const game = new TicTacToeGame()
    for (let i = 0; i < 9; i++) {
      const move = alphaBetaTreeAgent({ board: game.board, turn: game.turn })
      if(move !== undefined) {
        game.put(game.turn, move[0], move[1])
      }
    }
  })
  it('end game', () => {
    const game = new TicTacToeGame()
    game.put(game.turn, 0, 0)
    game.put(game.turn, 1, 0)
    game.put(game.turn, 2, 0)
    game.put(game.turn, 0, 1)
    game.put(game.turn, 1, 1)
    game.put(game.turn, 0, 2)
    const move = alphaBetaTreeAgent({ board: game.board, turn: game.turn })
    expect(move).toEqual([2,2])
  })
})
