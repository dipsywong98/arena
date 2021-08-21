import {
  expectGameStart,
  expectPutSymbol,
  expectTotalScore,
  listenEvent,
  putSymbol,
  setNow,
  startBattle,
  viewBattle
} from '../common'
import { TicTacToeCaseType } from '../../../src/ttt/types'
import { INITIAL_CLOCK_MS } from '../../../src/ttt/config'
import {
  housekeepForGameBattle,
  SHOULD_START_WITHIN
} from '../../../src/common/houseKeeping'
import { ticTacToeMoveWorker } from '../../../src/ttt/queues'

describe('ttt-housekeep', () => {
  it('reports zero score if didnt start in SHOULD_START_WITHIN', () => {
    const now = Date.now()
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      setNow(now + SHOULD_START_WITHIN),
      async (ctx) => { await housekeepForGameBattle('ttt', ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + SHOULD_START_WITHIN + 500),
      async (ctx) => { await housekeepForGameBattle('ttt', ctx.battleId) },
      expectTotalScore(0),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual("didnt start game with 30000")
      }))
  })

  it('reports zero score if didnt respond within the clock', () => {
    const now = Date.now()
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + INITIAL_CLOCK_MS),
      async (ctx) => { await housekeepForGameBattle('ttt', ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + INITIAL_CLOCK_MS + 200),
      async (ctx) => { await housekeepForGameBattle('ttt', ctx.battleId) },
      expectTotalScore(0),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual("You ran out of time")
      }))
  })

  it('slow from server doesnt count as overtime', () => {
    const now = Date.now()
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),

      // pause move processor so arena dont respond to participant's move
      // dont flip cause arena have inf respond time
      async () => await ticTacToeMoveWorker.pause(),
      putSymbol('N'),
      expectPutSymbol('N', 'X'),
      setNow(now + INITIAL_CLOCK_MS + 20000),
      async (ctx) => { await housekeepForGameBattle('ttt', ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toBeGreaterThan(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),

      // resume move processor, dont respond to move in time will flip
      async () => await Promise.resolve(ticTacToeMoveWorker.resume()),
      expectPutSymbol('NE', 'O'),
      setNow(now + INITIAL_CLOCK_MS + 40000),
      async (ctx) => { await housekeepForGameBattle('ttt', ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toBeGreaterThan(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual('You ran out of time')
      }),
    )
  })
})
