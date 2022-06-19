import {
  autoPlay,
  expectFlipTable,
  expectGameStart,
  expectTotalScore,
  flipTable,
  listenEvent,
  play,
  receiveEvent,
  requestForGrade,
  startBattle,
  startRun,
  viewBattle
} from '../common'
import { QuoridorActionType, QuoridorCaseType, QuoridorResult } from '../../../src/quoridor/types'
import {
  allPossibleWalls,
  applyAction,
  externalizeAction,
  initState,
  internalizeAction,
} from '../../../src/quoridor/common'
import { moveOnlyAgent } from '../../../src/quoridor/agent'
import axios from 'axios'
import { FLIP_TABLE } from '../../../src/common/constants'
import { expectPawnMove, expectPutWall, movePawn, putWall } from './utils'

const autoPlay1 = autoPlay({
  init: initState,
  apply: applyAction,
  agent: moveOnlyAgent,
  externalizeAction,
  internalizeAction
})

describe.skip('quoridor-simple', () => {
  it('generate the test cases', async () => {
    const battleIds = await requestForGrade('quoridor')
    expect(battleIds).toHaveLength(13)
  })

  it('gives me my position when start game', async () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'))
  })

  it('can receive AI movement', async () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_FIRST,
      listenEvent(),
      expectGameStart('second'),
      receiveEvent(event => {
        expect(event.player).toEqual('first')
      })
    )
  })

  it('can react to player movement', async () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_FIRST,
      listenEvent(),
      expectGameStart('second'),
      receiveEvent(event => {
        expect(event.player).toEqual('first')
      })
    )
  })

  it('autoplay', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      autoPlay1,
      viewBattle(battle => {
        expect(battle.result).toEqual('FIRST_WIN')
      }),
      expectTotalScore(15)
    )
  })

  it('flips when player second play before AI first', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_FIRST,
      movePawn('E2'),
      listenEvent(),
      expectGameStart('second'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('first')
        expect(battle.flippedReason).toEqual('Not your turn')
      }))
  })

  it('flips when player X flipped randomly', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'),
      flipTable(),
      expectFlipTable('first'),
      expectFlipTable('second'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('second')
        expect(battle.flippedReason).toEqual('You are not supposed to flip the table now')
      }),
      expectTotalScore(0))
  })



  it('flips when player play unknown action', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'),
      play({ something: 'idk' }),
      receiveEvent(value => {
        expect(value).toEqual({ player: 'first', something: 'idk' })
      }),
      expectFlipTable('second'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('second')
        expect(battle.flippedReason).toEqual('unknown action type')
      }),
      expectTotalScore(0))
  })

  it('flips when player play invalid json', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'),
      play('some invalid json content'),
      receiveEvent(value => {
        expect(value).toEqual({ player: 'first', 'some invalid json content': '' })
      }),
      expectFlipTable('second'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('second')
        expect(battle.flippedReason).toEqual('unknown action type')
      }),
      expectTotalScore(0))
  })

  it('flips when player move to invalid position', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'),
      movePawn('f9'),
      expectPawnMove('f9', 'first'),
      expectFlipTable('second'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('second')
        expect(battle.flippedReason).toEqual('Cannot move to f9')
      }),
      expectTotalScore(0))
  })

  describe('flips when player place walls exceed boundary', () => {
    it('|', () => {
      return startBattle('quoridor',
        QuoridorCaseType.BASE_AI_SECOND,
        listenEvent(),
        expectGameStart('first'),
        putWall('f9v'),
        expectPutWall('f9v', 'first'),
        expectFlipTable('second'),
        viewBattle(battle => {
          expect(battle.flippedBy).toEqual('second')
          expect(battle.flippedReason).toEqual('Cannot put | wall at f9')
        }),
        expectTotalScore(0))
    })

    it('-', () => {
      return startBattle('quoridor',
        QuoridorCaseType.BASE_AI_SECOND,
        listenEvent(),
        expectGameStart('first'),
        putWall('i8h'),
        expectPutWall('i8h', 'first'),
        expectFlipTable('second'),
        viewBattle(battle => {
          expect(battle.flippedBy).toEqual('second')
          expect(battle.flippedReason).toEqual('Cannot put - wall at i8')
        }),
        expectTotalScore(0))
    })
  })

  it('flip when player put overlapping wall', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'),
      putWall('a5h'),
      expectPutWall('a5h', 'first'),
      receiveEvent(),
      putWall('a5v'),
      expectPutWall('a5v', 'first'),
      expectFlipTable('second'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('second')
        expect(battle.flippedReason).toEqual('Cannot put | wall at a5')
      }),
      expectTotalScore(0))
  })

  it('flip when player block the road to goal', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'),
      putWall('d1v'),
      expectPutWall('d1v', 'first'),
      receiveEvent(),
      putWall('e1v'),
      expectPutWall('e1v', 'first'),
      receiveEvent(),
      putWall('d2h'),
      expectPutWall('d2h', 'first'),
      expectFlipTable('second'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('second')
        expect(battle.flippedReason).toEqual('Cannot put - wall at d2')
      }),
      expectTotalScore(0))
  })

  it('flip when player place 11th wall', () => {
    let numberOfWalls = 0
    const keepPlacingWall = autoPlay({
      init: initState,
      apply: applyAction,
      agent: state => {
        numberOfWalls++
        return allPossibleWalls(state)[0]
      },
      externalizeAction,
      internalizeAction
    })
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      keepPlacingWall,
      viewBattle(battle => {
        expect(numberOfWalls).toEqual(11)
        expect(battle.flippedBy).toEqual('second')
        expect(battle.flippedReason).toEqual('You have used up your walls')
      }),
      expectTotalScore(0))
  }, 100000)

  it('flips when player play twice a row', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_FIRST,
      listenEvent(),
      expectGameStart('second'),
      receiveEvent(),
      play(
        { action: QuoridorActionType.MOVE, position: 'e2' },
        { action: QuoridorActionType.MOVE, position: 'e3' }
      ),
      expectPawnMove('e2', 'second'),
      expectPawnMove('e3', 'second'),
      expectFlipTable('first'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('first')
        expect(battle.flippedReason).toEqual('send move before arena replies')
      }),
      expectTotalScore(0))
  })

  it('response with 429 if playin a ended battle', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_SECOND,
      listenEvent(),
      expectGameStart('first'),
      flipTable(),
      expectFlipTable('first'),
      expectFlipTable('second'),
      viewBattle(battle => {
        expect(battle.result).toEqual(QuoridorResult.FLIPPED)
      }),
      expectTotalScore(0),
      async (ctx) => {
        await axios.post(`/${ctx.game}/play/${ctx.battleId}`, { action: FLIP_TABLE })
          .then(() => {
            throw new Error('this request should throw 423 status code')
          })
          .catch(({ response }) => {
            expect(response.status).toEqual(423)
            expect(response.data).toEqual({ error: 'Battle already ended' })
          })
      })
  })

  it('whole all flip', () => {
    return startRun('quoridor', [
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable(),
      expectTotalScore(0)]
    ])
  })

  it('whole all flip 1 win', () => {
    return startRun('quoridor', [
      [listenEvent(),
        autoPlay1,
      viewBattle(battle => {
        expect(battle.score).toEqual(15)
      })],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable(),
      expectTotalScore(15)]
    ])
  })
})
