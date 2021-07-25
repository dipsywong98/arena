import { CaseType } from '../../../src/ttt/types'
import {
  expectGameStart,
  expectPutSymbol,
  expectWinner,
  play,
  requestForGrade,
  startBattle
} from '../common'

describe('ttt', () => {
  describe('simple', () => {
    it('request for grade will generate 8 battles', async () => {
      const battleIds = await requestForGrade()
      expect(battleIds).toHaveLength(8)
    })

    it('gives me my position when start game', async () => {
      return startBattle(
        CaseType.BASE_AI_O,
        expectGameStart('X')
      )
    })

    it('can receive ai movement', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O')
      )
    })

    it('can react to player movement', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        play(0, 1),
        expectPutSymbol(0, 1, 'X'),
        expectPutSymbol(1, 0, 'O')
      )
    })

    it('example: player win', () => {
      // O O X
      // O - X
      // - - X
      return startBattle(
        CaseType.BASE_AI_O,
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        play(2, 0),
        expectPutSymbol(2, 0, 'X'),
        expectPutSymbol(1, 0, 'O'),
        play(2, 1),
        expectPutSymbol(2, 1, 'X'),
        expectPutSymbol(0, 1, 'O'),
        play(2, 2),
        expectPutSymbol(2, 2, 'X'),
        expectWinner('X')
      )
    })

    it('example: ai win', () => {
      // O O O
      // - - X
      // - - X
      return startBattle(
        CaseType.BASE_AI_O,
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        play(2, 2),
        expectPutSymbol(2, 2, 'X'),
        expectPutSymbol(1, 0, 'O'),
        play(2, 1),
        expectPutSymbol(2, 1, 'X'),
        expectPutSymbol(2, 0, 'O'),
        expectWinner('O')
      )
    })

    it('example: draw', () => {
      // X X O
      // O O X
      // X O O
      return startBattle(
        CaseType.BASE_AI_X,
        expectGameStart('O'),
        play(2, 0),
        expectPutSymbol(2, 0, 'O'),
        expectPutSymbol(0, 0, 'X'),
        play(0, 1),
        expectPutSymbol(0, 1, 'O'),
        expectPutSymbol(1, 0, 'X'),
        play(1, 1),
        expectPutSymbol(1, 1, 'O'),
        expectPutSymbol(2, 1, 'X'),
        play(1, 2),
        expectPutSymbol(1, 2, 'O'),
        expectPutSymbol(0, 2, 'X'),
        play(2, 2),
        expectPutSymbol(2, 2, 'O'),
        expectWinner('DRAW')
      )
    })
  })
})
