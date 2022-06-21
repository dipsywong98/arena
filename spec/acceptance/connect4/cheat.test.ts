import {
  expectFlipTable,
  expectGameStart,
  expectTotalScore,
  flipTable,
  listenEvent,
  receiveEvent,
  startBattle
} from '../common'
import {
  Column,
  Connect4ActionType,
  Connect4CaseType,
  Connect4Turn
} from '../../../src/connect4/types'
import { putToken, expectPutToken } from './utils'

describe('connect4-cheat', () => {
  describe('C_AI_OUT_OF_BOUND', () => {
    it('dont flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_OUT_OF_BOUND,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectPutToken(Connect4Turn.YELLOW, 'H' as Column),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectFlipTable(Connect4Turn.YELLOW),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_OUT_OF_BOUND,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectPutToken(Connect4Turn.YELLOW, 'H' as Column),
        flipTable(),
        expectFlipTable(Connect4Turn.RED),
        expectTotalScore(3))
    })
  })
  describe('C_AI_OVERFLOW', () => {
    it('dont flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_OVERFLOW,
        listenEvent(),
        expectGameStart(Connect4Turn.YELLOW),
        ...'DDD'.split('').flatMap(() => [
          expectPutToken(Connect4Turn.RED),
          putToken('D'),
          expectPutToken(Connect4Turn.YELLOW),
        ]),
        expectPutToken(Connect4Turn.RED),
        putToken('B'),
        expectPutToken(Connect4Turn.YELLOW),
        expectFlipTable(Connect4Turn.RED),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_OVERFLOW,
        listenEvent(),
        expectGameStart(Connect4Turn.YELLOW),
        ...'DDD'.split('').flatMap(() => [
          expectPutToken(Connect4Turn.RED),
          putToken('D'),
          expectPutToken(Connect4Turn.YELLOW),
        ]),
        expectPutToken(Connect4Turn.RED),
        flipTable(),
        expectFlipTable(Connect4Turn.YELLOW),
        expectTotalScore(10))
    })
  })

  describe('C_AI_Y_FIRST', () => {
    it('dont flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_Y_FIRST,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        expectPutToken(Connect4Turn.YELLOW),
        putToken('A'),
        expectPutToken(Connect4Turn.RED),
        expectFlipTable(Connect4Turn.YELLOW),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_Y_FIRST,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        expectPutToken(Connect4Turn.YELLOW),
        flipTable(),
        expectFlipTable(Connect4Turn.RED),
        expectTotalScore(10))
    })
  })

  describe('C_AI_TWICE_A_ROW', () => {
    it('dont flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart(Connect4Turn.YELLOW),
        expectPutToken(Connect4Turn.RED),
        putToken('C'),
        expectPutToken(Connect4Turn.YELLOW),
        expectPutToken(Connect4Turn.RED),
        expectPutToken(Connect4Turn.RED),
        putToken('C'),
        expectPutToken(Connect4Turn.YELLOW),
        expectFlipTable(Connect4Turn.RED),
        expectTotalScore(0))
    })

    it('flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart(Connect4Turn.YELLOW),
        expectPutToken(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.YELLOW),
        expectPutToken(Connect4Turn.RED),
        expectPutToken(Connect4Turn.RED),
        flipTable(),
        expectFlipTable(Connect4Turn.YELLOW),
        expectTotalScore(10))
    })
  })

  describe('C_AI_FLIP_TABLE_RANDOMLY', () => {
    it('dont flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_FLIP_TABLE_RANDOMLY,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectFlipTable(Connect4Turn.YELLOW),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectFlipTable(Connect4Turn.YELLOW),
        expectTotalScore(0))
    })

    it('flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_FLIP_TABLE_RANDOMLY,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectFlipTable(Connect4Turn.YELLOW),
        flipTable(),
        expectFlipTable(Connect4Turn.RED),
        expectTotalScore(10))
    })
  })
  describe('C_AI_NIL', () => {
    it('dont flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_NIL,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        receiveEvent((event) => {
          expect(event).toEqual({
            action: Connect4ActionType.PUT_TOKEN,
            player: Connect4Turn.YELLOW,
          })
        }),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectFlipTable(Connect4Turn.YELLOW),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_NIL,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        receiveEvent((event) => {
          expect(event).toEqual({
            action: Connect4ActionType.PUT_TOKEN,
            player: Connect4Turn.YELLOW,
          })
        }),
        flipTable(),
        expectFlipTable(Connect4Turn.RED),
        expectTotalScore(3))
    })
  })
  describe('C_AI_SURPRISE', () => {
    it('dont flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_SURPRISE,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        receiveEvent((event) => {
          expect(event).toEqual({
            action: 'SUPRISE! 😁',
            player: Connect4Turn.YELLOW,
          })
        }),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        expectFlipTable(Connect4Turn.YELLOW),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('connect4',
        Connect4CaseType.C_AI_SURPRISE,
        listenEvent(),
        expectGameStart(Connect4Turn.RED),
        putToken('A'),
        expectPutToken(Connect4Turn.RED, 'A'),
        receiveEvent((event) => {
          expect(event).toEqual({
            action: 'SUPRISE! 😁',
            player: Connect4Turn.YELLOW,
          })
        }),
        flipTable(),
        expectFlipTable(Connect4Turn.RED),
        expectTotalScore(4))
    })
  })
})
