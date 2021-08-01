import abAgent from '../../../src/ttt/agent'
import { TicTacToeActionType, TicTacToeTurn } from '../../../src/ttt/types'

describe('abAgent', () => {
  it('can prevent losing', () => {
    const action = abAgent({
      board: [
        [TicTacToeTurn.O, TicTacToeTurn.O, TicTacToeTurn.X],
        [null, TicTacToeTurn.X, null],
        [null, null, null]],
      createdAt: 0,
      expectFlip: false,
      turn: TicTacToeTurn.O
    })
    expect(action.x).toEqual(0)
    expect(action.y).toEqual(2)
  })
  it('favors winner over losing', () => {
    const action = abAgent({
      board: [
        [TicTacToeTurn.O, TicTacToeTurn.O, TicTacToeTurn.X],
        [null, TicTacToeTurn.X, TicTacToeTurn.X],
        [TicTacToeTurn.O, null, null]],
      createdAt: 0,
      expectFlip: false,
      turn: TicTacToeTurn.O
    })
    expect(action.x).toEqual(0)
    expect(action.y).toEqual(1)
  })
  it('can output some location if not possible to prevent losing', () => {
    const action = abAgent({
      board: [
        [TicTacToeTurn.X, TicTacToeTurn.O, TicTacToeTurn.O],
        [TicTacToeTurn.X, null, TicTacToeTurn.X],
        [null, null, TicTacToeTurn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: TicTacToeTurn.O
    })
    expect(action.x).toEqual(1)
    expect(action.y).toEqual(1)
  })
  it('can output some location already lost', () => {
    const action = abAgent({
      board: [
        [TicTacToeTurn.X, TicTacToeTurn.O, TicTacToeTurn.O],
        [TicTacToeTurn.X, null, TicTacToeTurn.X],
        [TicTacToeTurn.X, null, TicTacToeTurn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: TicTacToeTurn.O
    })
    expect(action.x).toEqual(1)
    expect(action.y).toEqual(1)
  })
  it('can output some location if already win', () => {
    const action = abAgent({
      board: [
        [TicTacToeTurn.X, TicTacToeTurn.O, TicTacToeTurn.O],
        [TicTacToeTurn.X, null, TicTacToeTurn.O],
        [null, TicTacToeTurn.X, TicTacToeTurn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: TicTacToeTurn.O
    })
    expect(action.x).toEqual(1)
    expect(action.y).toEqual(1)
  })
  it('can output endgame if board full', () => {
    const action = abAgent({
      board: [
        [TicTacToeTurn.X, TicTacToeTurn.O, TicTacToeTurn.O],
        [TicTacToeTurn.O, TicTacToeTurn.O, TicTacToeTurn.X],
        [TicTacToeTurn.X, TicTacToeTurn.X, TicTacToeTurn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: TicTacToeTurn.O
    })
    expect(action.type).toEqual(TicTacToeActionType.END_GAME)
  })
})
