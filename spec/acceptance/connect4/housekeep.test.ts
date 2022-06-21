import {
  expectGameStart,
  expectTotalScore,
  listenEvent,
  setNow,
  startBattle,
  viewBattle
} from '../common'
import { Connect4CaseType, Connect4Turn } from '../../../src/connect4/types'
import { INITIAL_CLOCK_MS } from '../../../src/connect4/config'
import {
  housekeepForGameBattle,
  SHOULD_START_WITHIN
} from '../../../src/common/houseKeeping'
import { getMoveWorker } from '../../../src/common/queues'
import { Game } from '../../../src/common/types'
import { expectPutToken, putToken } from './utils'

describe('connect4-housekeep', () => {
  it('reports zero score if didnt start in SHOULD_START_WITHIN', () => {
    const now = Date.now()
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      setNow(now + SHOULD_START_WITHIN),
      async (ctx) => { await housekeepForGameBattle(Game.CONNECT4, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + SHOULD_START_WITHIN + 500),
      async (ctx) => { await housekeepForGameBattle(Game.CONNECT4, ctx.battleId) },
      expectTotalScore(0),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual("didnt start game with 300000")
      }))
  })

  it('reports zero score if didnt respond within the clock', () => {
    const now = Date.now()
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + INITIAL_CLOCK_MS),
      async (ctx) => { await housekeepForGameBattle(Game.CONNECT4, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + INITIAL_CLOCK_MS + 200),
      async (ctx) => { await housekeepForGameBattle(Game.CONNECT4, ctx.battleId) },
      expectTotalScore(0),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual("You ran out of time")
      }))
  })

  it('slow from server doesnt count as overtime', () => {
    const now = Date.now()
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),

      // pause move processor so arena dont respond to participant's move
      // dont flip cause arena have inf respond time
      async () => await getMoveWorker().pause(),
      putToken('A'),
      expectPutToken(Connect4Turn.YELLOW),
      setNow(now + INITIAL_CLOCK_MS + 20000),
      async (ctx) => { await housekeepForGameBattle(Game.CONNECT4, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toBeGreaterThan(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),

      // resume move processor, dont respond to move in time will flip
      async () => await Promise.resolve(getMoveWorker().resume()),
      expectPutToken(Connect4Turn.RED),
      setNow(now + INITIAL_CLOCK_MS + 40000),
      async (ctx) => { await housekeepForGameBattle(Game.CONNECT4, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toBeGreaterThan(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual('You ran out of time')
      }),
    )
  })
})
