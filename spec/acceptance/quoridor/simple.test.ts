import {
  autoPlay,
  expectFlipTable,
  expectGameStart,
  expectPawnMove,
  expectPutWall,
  expectTotalScore,
  flipTable,
  listenEvent,
  movePawn,
  putWall,
  receiveEvent,
  requestForGrade,
  startBattle,
  startRun,
  viewBattle
} from '../common'
import { QuoridorCaseType } from '../../../src/quoridor/types'
import {
  applyAction,
  externalizeAction,
  initState,
  internalizeAction
} from '../../../src/quoridor/common'
import { moveOnlyAgent } from '../../../src/quoridor/agent'

const autoPlay1 = autoPlay({
  init: initState,
  apply: applyAction,
  agent: moveOnlyAgent,
  externalizeAction,
  internalizeAction
})

describe('quoridor-simple', () => {
  it('generate the test cases', async () => {
    const battleIds = await requestForGrade('quoridor')
    expect(battleIds).toHaveLength(11)
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
      expectTotalScore(3)
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

  it('whole all 9 flip', () => {
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
      [flipTable(),
      expectTotalScore(0)]
    ])
  })

  it('whole all 9 flip 1 win', () => {
    return startRun('quoridor', [
      [listenEvent(),
        autoPlay1,
      viewBattle(battle => {
        expect(battle.score).toEqual(3)
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
      [flipTable(),
      expectTotalScore(3)]
    ])
  })
})
