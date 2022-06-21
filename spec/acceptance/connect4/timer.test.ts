import {
  expectFlipTable,
  expectGameStart,
  listenEvent,
  setNow,
  startBattle,
  viewBattle
} from '../common'
import { Connect4CaseType, Connect4Turn } from '../../../src/connect4/types'
import { INITIAL_CLOCK_MS, TURN_ADD_MS } from '../../../src/connect4/config'
import { expectPutToken, putToken } from './utils'

describe('connect4-timer', () => {
  it('initially is INITIAL_CLOCK_MS', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
      }))
  })
  it('advance by TURN_ADD_MS for each move', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R, setNow(100000),
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      setNow(101000),
      putToken('A'),
      expectPutToken(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS - 1000 + TURN_ADD_MS)
      }),
      setNow(105000),
      putToken('A'),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS - 5000 + TURN_ADD_MS * 2)
      }))
  })
  it('flipTable when time limit exceed', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R, setNow(100000),
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      setNow(200000),
      putToken('A'),
      expectPutToken(Connect4Turn.YELLOW),
      expectFlipTable(Connect4Turn.RED))
  })
})
