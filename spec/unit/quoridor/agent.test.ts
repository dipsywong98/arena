import { pipe } from 'ramda'
import {
  depressState, initState, isWallHavePath, movePawn, pathLength
} from '../../../src/quoridor/common'
import { abAgent, baseAgent } from '../../../src/quoridor/agent'
import { Orientation, QuoridorState, QuoridorTurn } from '../../../src/quoridor/types'

describe('quoridor', () => {
  describe('abAgent', () => {
    it('can prevent lose', () => {
      const action = pipe(initState, movePawn(2, 1), abAgent)()
      expect(action).toEqual({
        type: "putWall",
        x: expect.anything(),
        y: 0,
        o: '-'
      })
    })
    it('can win', () => {
      const action = pipe(initState, movePawn(2, 1), movePawn(4, 1), abAgent)()
      expect(action).toEqual({
        type: 'move',
        x: 2,
        y: 0,
      })
    })

    it('debug', () => {
      const state = depressState({
        // eslint-disable-next-line max-len
        "walls": "00000000000000000\n00000000000000000\n00000000000000000\n00000000000000000\n00000000000000000\n00000000001110000\n00000000000000000\n00000000001110000\n00000000000000000\n00000011101110000\n00000100000000000\n00000100111011100\n00000101000000000\n00001111111000000\n00000001000000000\n00111011100011100\n00000000000000000",
        "players": {
          "second": {
            "walls": 6,
            "x": 3,
            "y": 6
          },
          "first": {
            "walls": 1,
            "x": 6,
            "y": 6
          }
        },
        "turn": QuoridorTurn.FIRST,
        "expectFlip": false,
        "createdAt": 1632415697738
      })
      // const result = allPossibleWalls(state!)
      expect(isWallHavePath(state!, 6, 4, Orientation.VERTICAL)).toBeFalsy()
      // console.log(result)
    })

    it('debug2', () => {
      const state = depressState({
        // eslint-disable-next-line max-len
        "walls": "00000000000000000\n00001110001110000\n00010000000000000\n00011110111000000\n00010001010000000\n00000001011110111\n00000001010000000\n00000011100000000\n00000100000000000\n00111100000000111\n01010100000000000\n01010000000011100\n01010100010000000\n00000100010000111\n00000100010000000\n11100000000000000\n00000000000000000",
        "players": {
          "second": {
            "walls": 0,
            "x": 5,
            "y": 0
          },
          "first": {
            "walls": 0,
            "x": 5,
            "y": 7
          }
        },
        "turn": QuoridorTurn.SECOND,
        "expectFlip": false,
        "createdAt": 1632450075154
      })
      // const result = allPossibleWalls(state!)
      // const result = getWalkableNeighborCoords(state!, state!.turn)
      const result = abAgent(state!)
      expect(result).toBeTruthy()
    })

    it('debug3', () => {
      const state: QuoridorState | undefined = depressState({
        walls: '01000001000000000\n' +
          '01111001001110111\n' +
          '01000101000000000\n' +
          '00000111101110000\n' +
          '00000100000000000\n' +
          '00001110000011100\n' +
          '00000000000000000\n' +
          '00000000000000000\n' +
          '00000000000000000\n' +
          '00000000000000000\n' +
          '00000000000000000\n' +
          '00000000000011100\n' +
          '00000000010000000\n' +
          '00000011111110000\n' +
          '00000000010000000\n' +
          '00000000000000111\n' +
          '00000000000000000',
        players: { second: { walls: 5, x: 5, y: 6 }, first: { walls: 0, x: 2, y: 1 } },
        turn: QuoridorTurn.SECOND,
        expectFlip: false,
        createdAt: 1632455782510
      })
      const pl1 = pathLength(state!, QuoridorTurn.FIRST)
      expect(pl1).not.toEqual(-1)
    })
  })

  describe('baseAgent', () => {
    it('can give some action', () => {
      const action = pipe(initState, movePawn(2, 1), baseAgent)()
      expect(action).toBeTruthy()
    })
  })
})

