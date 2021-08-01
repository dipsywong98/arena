import {
  autoPlay,
  expectFlipTable,
  expectGameStart,
  expectPawnMove,
  expectTotalScore,
  flipTable,
  listenEvent,
  movePawn,
  receiveEvent,
  requestForGrade,
  startBattle,
  startRun,
  viewBattle
} from '../common'
import { QuoridorCaseType } from '../../../src/quoridor/types'
import { applyAction, initState } from '../../../src/quoridor/common'
import { moveOnlyAgent } from '../../../src/quoridor/agent'

const autoPlay1 = autoPlay({
  init: initState,
  apply: applyAction,
  agent: moveOnlyAgent,
  externalizeAction: a => a,
  internalizeAction: <T> (a: T) => a
})

describe('quoridor-simple', () => {
  it('generate the test cases', async () => {
    const battleIds = await requestForGrade('quoridor')
    expect(battleIds).toHaveLength(5)
  })

  it('gives me my position when start game', async () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_WHITE,
      listenEvent(),
      expectGameStart('black'))
  })

  it('can receive AI movement', async () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_BLACK,
      listenEvent(),
      expectGameStart('white'),
      receiveEvent(event => {
        expect(event.player).toEqual('black')
      })
    )
  })

  it('can react to player movement', async () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_BLACK,
      listenEvent(),
      expectGameStart('white'),
      receiveEvent(event => {
        expect(event.player).toEqual('black')
      })
    )
  })

  it('autoplay', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_WHITE,
      listenEvent(),
      autoPlay1,
      viewBattle(battle => {
        expect(battle.result).toEqual('BLACK_WIN')
      }),
      expectTotalScore(3)
    )
  })

  it('flips when player white play before AI black', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_BLACK,
      movePawn(4, 7),
      listenEvent(),
      expectGameStart('white'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('black')
        expect(battle.flippedReason).toEqual('Not your turn')
      }))
  })

  it('flips when player X flipped randomly', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_WHITE,
      listenEvent(),
      expectGameStart('black'),
      flipTable(),
      expectFlipTable('black'),
      expectFlipTable('white'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('white')
        expect(battle.flippedReason).toEqual('You are not supposed to flip the table now')
      }),
      expectTotalScore(0))
  })

  it('flips when player move to invalid position', () => {
    return startBattle('quoridor',
      QuoridorCaseType.BASE_AI_WHITE,
      listenEvent(),
      expectGameStart('black'),
      movePawn(5, 0),
      expectPawnMove(5, 0, 'black'),
      expectFlipTable('white'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('white')
        expect(battle.flippedReason).toEqual('Cannot move to 5,0')
      }),
      expectTotalScore(0))
  })

  it('whole all 9 flip', () => {
    return startRun('quoridor', [
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
      [flipTable(),
        expectTotalScore(3)]
    ])
  })
})
