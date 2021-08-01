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
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'O'),
        expectPutSymbol(3, 3, 'X'),
        putSymbol(0, 2),
        expectPutSymbol(0, 2, 'O'),
        expectFlipTable('X'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_OUT_OF_BOUND,
        listenEvent(),
        expectGameStart('O'),
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'O'),
        expectPutSymbol(3, 3, 'X'),
        flipTable(),
        expectFlipTable('O'),
        expectTotalScore(1))
    })
  })
  describe('C_AI_DUP', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_DUP,
        listenEvent(),
        expectGameStart('O'),
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'O'),
        expectPutSymbol(0, 1, 'X'),
        putSymbol(0, 2),
        expectPutSymbol(0, 2, 'O'),
        expectFlipTable('X'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_DUP,
        listenEvent(),
        expectGameStart('O'),
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'O'),
        expectPutSymbol(0, 1, 'X'),
        flipTable(),
        expectFlipTable('O'),
        expectTotalScore(1))
    })
  })
  describe('C_AI_X_FIRST', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_X_FIRST,
        listenEvent(),
        expectGameStart('O'),
        expectPutSymbol(0, 0, 'X'),
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'O'),
        expectFlipTable('X'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_X_FIRST,
        listenEvent(),
        expectGameStart('O'),
        expectPutSymbol(0, 0, 'X'),
        flipTable(),
        expectFlipTable('O'),
        expectTotalScore(1))
    })
  })
  describe('C_AI_TWICE_A_ROW', () => {
    it('dont flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'X'),
        expectPutSymbol(2, 1, 'O'),
        expectPutSymbol(1, 0, 'O'),
        putSymbol(1, 1),
        expectPutSymbol(1, 1, 'X'),
        expectFlipTable('O'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('tic-tac-toe',
        TicTacToeCaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'X'),
        expectPutSymbol(2, 1, 'O'),
        expectPutSymbol(1, 0, 'O'),
        flipTable(),
        expectFlipTable('X'),
        expectTotalScore(1))
    })
  })
})
