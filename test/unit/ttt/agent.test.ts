import abAgent from '../../../src/ttt/agent'
import { TicTacToeActionType, Turn } from '../../../src/ttt/types'

describe('abAgent', () => {
  it('can prevent losing', () => {
    const action = abAgent({
      board: [
        [Turn.O, Turn.O, Turn.X],
        [null, Turn.X, null],
        [null, null, null]],
      createdAt: 0,
      expectFlip: false,
      turn: Turn.O
    })
    expect(action.x).toEqual(0)
    expect(action.y).toEqual(2)
  })
  it('favors winner over losing', () => {
    const action = abAgent({
      board: [
        [Turn.O, Turn.O, Turn.X],
        [null, Turn.X, Turn.X],
        [Turn.O, null, null]],
      createdAt: 0,
      expectFlip: false,
      turn: Turn.O
    })
    expect(action.x).toEqual(0)
    expect(action.y).toEqual(1)
  })
  it('can output some location if not possible to prevent losing', () => {
    const action = abAgent({
      board: [
        [Turn.X, Turn.O, Turn.O],
        [Turn.X, null, Turn.X],
        [null, null, Turn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: Turn.O
    })
    expect(action.x).toEqual(1)
    expect(action.y).toEqual(1)
  })
  it('can output some location already lost', () => {
    const action = abAgent({
      board: [
        [Turn.X, Turn.O, Turn.O],
        [Turn.X, null, Turn.X],
        [Turn.X, null, Turn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: Turn.O
    })
    expect(action.x).toEqual(1)
    expect(action.y).toEqual(1)
  })
  it('can output some location if already win', () => {
    const action = abAgent({
      board: [
        [Turn.X, Turn.O, Turn.O],
        [Turn.X, null, Turn.O],
        [null, Turn.X, Turn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: Turn.O
    })
    expect(action.x).toEqual(1)
    expect(action.y).toEqual(1)
  })
  it('can output endgame if board full', () => {
    const action = abAgent({
      board: [
        [Turn.X, Turn.O, Turn.O],
        [Turn.O, Turn.O, Turn.X],
        [Turn.X, Turn.X, Turn.O]],
      createdAt: 0,
      expectFlip: false,
      turn: Turn.O
    })
    expect(action.type).toEqual(TicTacToeActionType.END_GAME)
  })
})
