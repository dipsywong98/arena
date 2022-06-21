import {
  expectGameStart,
  expectTotalScore,
  listenEvent,
  receiveEvent,
  setNow,
  startBattle,
  viewBattle
} from '../common'
import { QuoridorCaseType } from '../../../src/quoridor/types'
import { INITIAL_CLOCK_MS } from '../../../src/quoridor/config'
import {
  housekeepForGameBattle,
  SHOULD_START_WITHIN
} from '../../../src/common/houseKeeping'
import { getMoveWorker } from '../../../src/common/queues'
import { Game } from '../../../src/common/types'
import { putWall, expectPutWall } from './utils'

describe('quoridor-housekeep', () => {
  it('reports zero score if didnt start in SHOULD_START_WITHIN', () => {
    const now = Date.now()
    return startBattle(Game.QUORIDOR,
      QuoridorCaseType.BASE_AI_FIRST,
      setNow(now + SHOULD_START_WITHIN),
      async (ctx) => { await housekeepForGameBattle(Game.QUORIDOR, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + SHOULD_START_WITHIN + 500),
      async (ctx) => { await housekeepForGameBattle(Game.QUORIDOR, ctx.battleId) },
      expectTotalScore(0),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual("didnt start game with 300000")
      }))
  })

  it('reports zero score if didnt respond within the clock', () => {
    const now = Date.now()
    return startBattle(Game.QUORIDOR,
      QuoridorCaseType.BASE_AI_FIRST,
      listenEvent(),
      expectGameStart('second'),
      receiveEvent(),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + INITIAL_CLOCK_MS),
      async (ctx) => { await housekeepForGameBattle(Game.QUORIDOR, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),
      setNow(now + INITIAL_CLOCK_MS + 200),
      async (ctx) => { await housekeepForGameBattle(Game.QUORIDOR, ctx.battleId) },
      expectTotalScore(0),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual("You ran out of time")
      }))
  })

  it('slow from server doesnt count as overtime', () => {
    const now = Date.now()
    return startBattle(Game.QUORIDOR,
      QuoridorCaseType.BASE_AI_FIRST,
      listenEvent(),
      expectGameStart('second'),
      receiveEvent(),
      viewBattle(battle => {
        expect(battle.clock).toEqual(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),

      // pause move processor so arena dont respond to participant's move
      // dont flip cause arena have inf respond time
      async () => await getMoveWorker().pause(),
      putWall('e2v'),
      expectPutWall('e2v', 'second'),
      setNow(now + INITIAL_CLOCK_MS + 20000),
      async (ctx) => { await housekeepForGameBattle(Game.QUORIDOR, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toBeGreaterThan(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).not.toBeDefined()
      }),

      // resume move processor, dont respond to move in time will flip
      async () => await Promise.resolve(getMoveWorker().resume()),
      receiveEvent(),
      setNow(now + INITIAL_CLOCK_MS + 40000),
      async (ctx) => { await housekeepForGameBattle(Game.QUORIDOR, ctx.battleId) },
      viewBattle(battle => {
        expect(battle.clock).toBeGreaterThan(INITIAL_CLOCK_MS)
        expect(battle.flippedReason).toEqual('You ran out of time')
      }),
    )
  })
})
