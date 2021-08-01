import {
  autoPlay, expectFlipTable,
  expectGameStart, expectTotalScore, flipTable,
  listenEvent, movePawn,
  receiveEvent,
  requestForGrade,
  startBattle, viewBattle, expectPawnMove, startRun
} from '../common'
import { CaseType } from '../../../src/quoridor/types'
import { initState, applyAction } from '../../../src/quoridor/common'
import { moveOnlyAgent } from '../../../src/quoridor/agent'

describe('quoridor-simple', () => {
  it('generate the test cases', async () => {
    const battleIds = await requestForGrade('quoridor')
    expect(battleIds).toHaveLength(5)
  })

  it('gives me my position when start game', async () => {
    return startBattle('quoridor',
      CaseType.BASE_AI_WHITE,
      listenEvent(),
      expectGameStart('black'))
  })

  it('can receive AI movement', async () => {
    return startBattle('quoridor',
      CaseType.BASE_AI_BLACK,
      listenEvent(),
      expectGameStart('white'),
      receiveEvent(event => {
        expect(event.player).toEqual('black')
      })
    )
  })

  it('can react to player movement', async () => {
    return startBattle('quoridor',
      CaseType.BASE_AI_BLACK,
      listenEvent(),
      expectGameStart('white'),
      receiveEvent(event => {
        expect(event.player).toEqual('black')
      })
    )
  })

  it('autoplay', () => {
    return startBattle('quoridor',
      CaseType.BASE_AI_WHITE,
      listenEvent(),
      autoPlay({ init: initState, apply: applyAction, agent: moveOnlyAgent }),
      viewBattle(battle => {
        expect(battle.result).toEqual('BLACK_WIN')
      }),
      expectTotalScore(3)
    )
  })

  it('flips when player white play before AI black', () => {
    return startBattle('quoridor',
      CaseType.BASE_AI_BLACK,
      movePawn(4, 7),
      listenEvent(),
      expectGameStart('white'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('black')
        expect(battle.flippedReason).toEqual('Not your turn')
      }),
      expectTotalScore(0))
  })

  it('flips when player X flipped randomly', () => {
    return startBattle('quoridor',
      CaseType.BASE_AI_WHITE,
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
      CaseType.BASE_AI_WHITE,
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
        autoPlay({ init: initState, apply: applyAction, agent: moveOnlyAgent }),
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
