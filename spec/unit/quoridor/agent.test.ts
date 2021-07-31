import { pipe } from 'ramda'
import { initState, movePawn } from '../../../src/quoridor/common'
import { abAgent } from '../../../src/quoridor/agent'

describe('quoridor', () => {
  describe('abAgent', () => {
    it('can prevent lose', () => {
      const action = pipe(initState, movePawn(2, 1), abAgent)()
      expect(action).toEqual({
        x: 1,
        y: 0,
        o: '-'
      })
    })
    it('can win', () => {
      const action = pipe(initState, movePawn(2, 1), movePawn(4, 1), abAgent)()
      expect(action).toEqual({
        x: 2,
        y: 0,
      })
    })
  })
})
