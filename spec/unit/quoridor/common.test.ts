import produce from 'immer'
import { Orientation, QuoridorTurn } from '../../../src/quoridor/types'
import { getWalkableNeighborCoords, initState, putWall } from '../../../src/quoridor/common'

describe('quoridor', () => {
  describe('getWalkableNeighborNodes', () => {
    it('trivial case', () => {
      const state = produce(initState(), draft => {
        draft.players[QuoridorTurn.WHITE].x = 4
        draft.players[QuoridorTurn.WHITE].y = 4
      })
      expect(getWalkableNeighborCoords(state, QuoridorTurn.WHITE))
        .toEqual([
          {x: 4, y: 3},
          {x: 5, y: 4},
          {x: 4, y: 5},
          {x: 3, y: 4},
        ])
    })
    it('border case', () => {
      const state = produce(initState(), draft => {
        draft.players[QuoridorTurn.WHITE].x = 0
        draft.players[QuoridorTurn.WHITE].y = 4
      })
      expect(getWalkableNeighborCoords(state, QuoridorTurn.WHITE))
        .toEqual([
          {x: 0, y: 3},
          {x: 1, y: 4},
          {x: 0, y: 5},
        ])
    })
    it('wall case', () => {
      const state1 = putWall(4, 0, Orientation.HORIZONTAL)(initState())
      expect(getWalkableNeighborCoords(state1, QuoridorTurn.WHITE))
        .toEqual([
          {x: 5, y: 0},
          {x: 3, y: 0},
        ])
    })
    it('jump pawn straight', () => {
      const state = initState()
      state.players[QuoridorTurn.WHITE].x = 4
      state.players[QuoridorTurn.WHITE].y = 4
      state.players[QuoridorTurn.BLACK].x = 3
      state.players[QuoridorTurn.BLACK].y = 4
      expect(getWalkableNeighborCoords(state, QuoridorTurn.BLACK))
        .toEqual([
          {x: 3, y: 3},
          {x: 5, y: 4},
          {x: 3, y: 5},
          {x: 2, y: 4},
        ])
    })
    it('jump pawn has wall', () => {
      const state = produce(putWall(4, 4, Orientation.VERTICAL)(initState()), draft => {
        draft.players[QuoridorTurn.WHITE].x = 4
        draft.players[QuoridorTurn.WHITE].y = 4
        draft.players[QuoridorTurn.BLACK].x = 3
        draft.players[QuoridorTurn.BLACK].y = 4
      })
      expect(getWalkableNeighborCoords(state, QuoridorTurn.BLACK))
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
