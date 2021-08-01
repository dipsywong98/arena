import {
  expectFlipTable,
  expectGameStart,
  expectPutSymbol,
  listenEvent,
  putSymbol,
  setNow,
  startBattle,
  viewBattle
} from '../common'
import { CaseType } from '../../../src/ttt/types'
import { INITIAL_CLOCK_MS, TURN_ADD_MS } from '../../../src/ttt/config'

describe('ttt-timer', () => {
  it('initially is INITIAL_CLOCK_MS', () => {
    return startBattle('tic-tac-toe',
      CaseType.BASE_AI_O,
      listenEvent(),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
      }))
  })
  it('advance by TURN_ADD_MS for each move', () => {
    return startBattle('tic-tac-toe',
      CaseType.BASE_AI_O, setNow(100000),
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol(0, 0, 'O'),
      setNow(101000),
      putSymbol(1, 0),
      expectPutSymbol(1, 0, 'X'),
      expectPutSymbol(2, 0, 'O'),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS - 1000 + TURN_ADD_MS)
      }),
      setNow(105000),
      putSymbol(1, 0),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS - 5000 + TURN_ADD_MS * 2)
      }))
  })
  it('flipTable when time limit exceed', () => {
    return startBattle('tic-tac-toe',
      CaseType.BASE_AI_O, setNow(100000),
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol(0, 0, 'O'),
      setNow(200000),
      putSymbol(1, 0),
      expectPutSymbol(1, 0, 'X'),
      expectFlipTable('O'))
  })
})
