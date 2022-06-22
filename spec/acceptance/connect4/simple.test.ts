import { abAgent } from '../../../src/connect4/agent'
import { Column, Connect4CaseType, Connect4Result, Connect4Turn } from '../../../src/connect4/types'
import {
  autoPlay,
  expectFlipTable,
  expectGameStart,
  expectTotalScore,
  expectWinner,
  flipTable,
  listenEvent,
  play,
  receiveEvent,
  requestForGrade,
  startBattle,
  startRun,
  viewBattle
} from '../common'
import { initState } from '../../../src/connect4/config'
import { applyAction, externalizeAction, internalizeAction } from '../../../src/connect4/common'
import { FLIP_TABLE } from '../../../src/common/constants'
import axios from 'axios'
import { expectPutToken, putToken } from './utils'
import * as GetRandomMove from '../../../src/connect4/getRandomMove'

const winSequence = (score: number) => [
  expectGameStart(Connect4Turn.YELLOW),
  expectPutToken(Connect4Turn.RED, 'A'),
  putToken('C'),
  expectPutToken(Connect4Turn.YELLOW, 'C'),
  expectPutToken(Connect4Turn.RED, 'A'),
  putToken('C'),
  expectPutToken(Connect4Turn.YELLOW, 'C'),
  expectPutToken(Connect4Turn.RED, 'A'),
  putToken('A'),
  expectPutToken(Connect4Turn.YELLOW, 'A'),
  expectPutToken(Connect4Turn.RED, 'A'),
  putToken('C'),
  expectPutToken(Connect4Turn.YELLOW, 'C'),
  expectPutToken(Connect4Turn.RED, 'A'),
  putToken('C'),
  expectPutToken(Connect4Turn.YELLOW, 'C'),
  expectWinner(Connect4Turn.YELLOW),
  expectTotalScore(score)
]

describe('connect4-simple', () => {
  beforeEach(() => {
    // make testing easier, make arena always use first available column
    jest.spyOn(GetRandomMove, 'getRandomMove').mockReturnValue(0)
  })


  it('request for grade will generate 9 battles', async () => {
    const battleIds = await requestForGrade('connect4')
    expect(battleIds).toHaveLength(11)
  })

  it('gives me my position when start game', async () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(), expectGameStart(Connect4Turn.YELLOW))
  })

  it('can receive ai movement', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED, "A"))
  })

  it('can react to player movement', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      putToken("A"),
      expectPutToken(Connect4Turn.YELLOW, "A"),
      expectPutToken(Connect4Turn.RED))
  })

  it('example: player win', () => {
    return startBattle(
      'connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      ...winSequence(10),
    )
  })

  it('example: ai win', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      putToken('B'),
      expectPutToken(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      putToken('B'),
      expectPutToken(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      putToken('B'),
      expectPutToken(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      expectWinner(Connect4Turn.RED),
      expectTotalScore(0))
  })

  it('example: draw', () => {
    const drawSequence: Column[] = 'BBADDBBCCDFDFFEEGGFGG'.split('') as Column[]
    return startBattle('connect4', Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      ...drawSequence.flatMap((c) => [
        expectPutToken(Connect4Turn.RED),
        putToken(c),
        expectPutToken(Connect4Turn.YELLOW),

      ]),
      expectWinner('DRAW'),
      expectTotalScore(0))
  })

  it('flips when player YELLOW play before AI RED', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R, putToken('A'),
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual(Connect4Turn.RED)
        expect(battle.flippedReason).toEqual('Not your turn')
      }),
      expectTotalScore(0))
  })

  it('flips when player YELLOW flipped randomly', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      receiveEvent(),
      flipTable(),
      expectFlipTable(Connect4Turn.YELLOW),
      expectFlipTable(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual(Connect4Turn.RED)
        expect(battle.flippedReason).toEqual('You are not supposed to flip the table now')
      }),
      expectTotalScore(0))
  })

  it('flips when player RED put at fully occupied column', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_Y,
      listenEvent(),
      expectGameStart(Connect4Turn.RED),
      ...'AAA'.split('').flatMap(() => [
        putToken('A'),
        expectPutToken(Connect4Turn.RED),
        expectPutToken(Connect4Turn.YELLOW),
      ]),
      putToken('A'),
      expectPutToken(Connect4Turn.RED),
      expectFlipTable(Connect4Turn.YELLOW),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual(Connect4Turn.YELLOW)
        expect(battle.flippedReason).toEqual('Column A is full')
      }),
      expectTotalScore(0))
  })

  it('flips when player YELLOW put outside of the board', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      putToken('H' as Column),
      expectPutToken(Connect4Turn.YELLOW),
      expectFlipTable(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual(Connect4Turn.RED)
        expect(battle.flippedReason).toEqual('H is not a valid column')
      }),
      expectTotalScore(0))
  })

  it('flips when player play unknown action', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      play({ something: 'idk' }),
      receiveEvent(value => {
        expect(value).toEqual({ player: Connect4Turn.YELLOW, something: 'idk' })
      }),
      expectFlipTable(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual(Connect4Turn.RED)
        expect(battle.flippedReason).toEqual('unknown action type')
      }),
      expectTotalScore(0))
  })

  it('flips when player play invalid json', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      play('some invalid json content'),
      receiveEvent(value => {
        expect(value).toEqual({ player: Connect4Turn.YELLOW, 'some invalid json content': '' })
      }),
      expectFlipTable(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual(Connect4Turn.RED)
        expect(battle.flippedReason).toEqual('unknown action type')
      }),
      expectTotalScore(0))
  })

  it('flips when player play twice a row', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      expectGameStart(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.RED),
      play({ action: 'putToken', column: 'B' }, { action: 'putToken', column: 'B' }),
      expectPutToken(Connect4Turn.YELLOW),
      expectPutToken(Connect4Turn.YELLOW),
      expectFlipTable(Connect4Turn.RED),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual(Connect4Turn.RED)
        expect(battle.flippedReason).toEqual('send move before arena replies')
      }),
      expectTotalScore(0))
  })

  it('response with 429 if playing a ended battle', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_Y,
      listenEvent(),
      expectGameStart(Connect4Turn.RED),
      flipTable(),
      expectFlipTable(Connect4Turn.RED),
      expectFlipTable(Connect4Turn.YELLOW),
      viewBattle(battle => {
        expect(battle.result).toEqual(Connect4Result.FLIPPED)
      }),
      expectTotalScore(0),
      async (ctx) => {
        await axios.post(`/${ctx.game}/play/${ctx.battleId}`, { action: FLIP_TABLE })
          .catch(({ response }) => {
            expect(response.status).toEqual(423)
            expect(response.data).toEqual({ error: 'Battle already ended' })
          })
      })
  })

  it('whole all flip', () => {
    return startRun('connect4', [
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

  it('1 win rest flip', () => {
    return startRun('connect4', [
      [listenEvent(),
      ...winSequence(10), expectTotalScore(10)],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()],
      [flipTable()]
    ])
  })

  it('autoplay', () => {
    return startBattle('connect4',
      Connect4CaseType.BASE_AI_R,
      listenEvent(),
      autoPlay({
        init: initState, apply: applyAction, agent: abAgent, externalizeAction, internalizeAction
      }),
      viewBattle(battle => {
        expect(battle.result).toEqual('YELLOW_WIN')
      }),
      expectTotalScore(10)
    )
  }, 30000)
})
