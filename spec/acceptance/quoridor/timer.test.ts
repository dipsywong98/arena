import {
  expectFlipTable,
  expectGameStart,
  listenEvent,
  receiveEvent,
  setNow,
  startBattle,
  viewBattle
} from '../common'
import { QuoridorCaseType } from '../../../src/quoridor/types'
import { INITIAL_CLOCK_MS, TURN_ADD_MS } from '../../../src/quoridor/config'
import { movePawn, expectPawnMove } from './utils'

describe('quoridor-timer', () => {
  it('initially is INITIAL_CLOCK_MS', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_FIRST,
      listenEvent(),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
      }))
  })
  it('advance by TURN_ADD_MS for each move', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_FIRST,
      setNow(100000),
      listenEvent(),
      expectGameStart('second'),
      receiveEvent(),
      setNow(101000),
      movePawn('e8'),
      expectPawnMove('e8', 'second'),
      receiveEvent(),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS - 1000 + TURN_ADD_MS)
      }),
      setNow(105000),
      movePawn('e9'),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS - 5000 + TURN_ADD_MS * 2)
      }))
  })
  it('flipTable when time limit exceed', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_FIRST,
      setNow(100000),
      listenEvent(),
      expectGameStart('second'),
      receiveEvent(),
      setNow(200000),
      movePawn('e8'),
      expectPawnMove('e8', 'second'),
      expectFlipTable('first'))
  })
})
