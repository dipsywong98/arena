import {
  expectFlipTable,
  expectGameStart,
  expectPutSymbol,
  expectTotalScore,
  flipTable,
  listenEvent,
  putSymbol,
  startBattle
} from '../common'
import { TicTacToeCaseType } from '../../../src/ttt/types'

describe('ttt-cheat', () => {
  describe('C_AI_OUT_OF_BOUND', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_OUT_OF_BOUND,
        listenEvent(),
        expectGameStart('O'),
        putSymbol('W'),
        expectPutSymbol('W', 'O'),
        expectPutSymbol('', 'X'),
        putSymbol('SW'),
        expectPutSymbol('SW', 'O'),
        expectFlipTable('X'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_OUT_OF_BOUND,
        listenEvent(),
        expectGameStart('O'),
        putSymbol('W'),
        expectPutSymbol('W', 'O'),
        expectPutSymbol('', 'X'),
        flipTable(),
        expectFlipTable('O'),
        expectTotalScore(4))
    })
  })
  describe('C_AI_DUP', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_DUP,
        listenEvent(),
        expectGameStart('O'),
        putSymbol('W'),
        expectPutSymbol('W', 'O'),
        expectPutSymbol('W', 'X'),
        putSymbol('SW'),
        expectPutSymbol('SW', 'O'),
        expectFlipTable('X'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_DUP,
        listenEvent(),
        expectGameStart('O'),
        putSymbol('W'),
        expectPutSymbol('W', 'O'),
        expectPutSymbol('W', 'X'),
        flipTable(),
        expectFlipTable('O'),
        expectTotalScore(4))
    })
  })
  describe('C_AI_X_FIRST', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_X_FIRST,
        listenEvent(),
        expectGameStart('O'),
        expectPutSymbol('NW', 'X'),
        putSymbol('W'),
        expectPutSymbol('W', 'O'),
        expectFlipTable('X'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_X_FIRST,
        listenEvent(),
        expectGameStart('O'),
        expectPutSymbol('NW', 'X'),
        flipTable(),
        expectFlipTable('O'),
        expectTotalScore(4))
    })
  })
  describe('C_AI_TWICE_A_ROW', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol('NW', 'O'),
        putSymbol('W'),
        expectPutSymbol('W', 'X'),
        expectPutSymbol('E', 'O'),
        expectPutSymbol('N', 'O'),
        putSymbol('C'),
        expectPutSymbol('C', 'X'),
        expectFlipTable('O'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol('NW', 'O'),
        putSymbol('W'),
        expectPutSymbol('W', 'X'),
        expectPutSymbol('E', 'O'),
        expectPutSymbol('N', 'O'),
        flipTable(),
        expectFlipTable('X'),
        expectTotalScore(4))
    })
  })

  describe('C_AI_FLIP_TABLE_RANDOMLY', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_FLIP_TABLE_RANDOMLY,
        listenEvent(),
        expectGameStart('O'),
        putSymbol('W'),
        expectPutSymbol('W', 'O'),
        expectFlipTable('X'),
        putSymbol('C'),
        expectPutSymbol('C', 'O'),
        expectFlipTable('X'),
        expectTotalScore(0))
    })

    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_FLIP_TABLE_RANDOMLY,
        listenEvent(),
        expectGameStart('O'),
        putSymbol('W'),
        expectPutSymbol('W', 'O'),
        expectFlipTable('X'),
        flipTable(),
        expectFlipTable('O'),
        expectTotalScore(4))
    })    
  })
})
