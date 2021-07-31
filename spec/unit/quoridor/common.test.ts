import produce from 'immer'
import { Orientation, Turn } from '../../../src/quoridor/types'
import {
  getWalkableNeighborCoords,
  initState,
  putWall,
} from '../../../src/quoridor/common'

describe('quoridor', () => {
  describe('getWalkableNeighborNodes', () => {
    it('trivial case', () => {
      const state = produce(initState(), draft => {
        draft.players[Turn.WHITE].x = 4
        draft.players[Turn.WHITE].y = 4
      })
      expect(getWalkableNeighborCoords(state, Turn.WHITE))
        .toEqual([
          {x: 4, y: 3},
          {x: 5, y: 4},
          {x: 4, y: 5},
          {x: 3, y: 4},
        ])
    })
    it('border case', () => {
      const state = produce(initState(), draft => {
        draft.players[Turn.WHITE].x = 0
        draft.players[Turn.WHITE].y = 4
      })
      expect(getWalkableNeighborCoords(state, Turn.WHITE))
        .toEqual([
          {x: 0, y: 3},
          {x: 1, y: 4},
          {x: 0, y: 5},
        ])
    })
    it('wall case', () => {
      const state1 = putWall(initState(), 4, 0, Orientation.HORIZONTAL)
      expect(getWalkableNeighborCoords(state1, Turn.WHITE))
        .toEqual([
          {x: 5, y: 0},
          {x: 3, y: 0},
        ])
    })
    it('jump pawn straight', () => {
      const state = initState()
      state.players[Turn.WHITE].x = 4
      state.players[Turn.WHITE].y = 4
      state.players[Turn.BLACK].x = 3
      state.players[Turn.BLACK].y = 4
      expect(getWalkableNeighborCoords(state, Turn.BLACK))
        .toEqual([
          {x: 3, y: 3},
          {x: 5, y: 4},
          {x: 3, y: 5},
          {x: 2, y: 4},
        ])
    })
    it('jump pawn has wall', () => {
      const state = produce(putWall(initState(), 4, 4, Orientation.VERTICAL), draft => {
        draft.players[Turn.WHITE].x = 4
        draft.players[Turn.WHITE].y = 4
        draft.players[Turn.BLACK].x = 3
        draft.players[Turn.BLACK].y = 4
      })
      expect(getWalkableNeighborCoords(state, Turn.BLACK))
        .toEqual([
          {x: 3, y: 3},
          {x: 4, y: 5},
          {x: 4, y: 3},
          {x: 3, y: 5},
          {x: 2, y: 4},
        ])
    })
  })
})
