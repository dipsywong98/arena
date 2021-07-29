import { CaseType } from '../../../src/ttt/types'
import {
  expectGameStart,
  expectPutSymbol,
  expectTotalScore,
  expectWinner,
  flipTable,
  listenEvent,
  putSymbol,
  receiveEvent,
  requestForGrade,
  startBattle,
  startRun,
  viewBattle
} from '../common'

const winSequence = [
  expectGameStart('X'),
  expectPutSymbol(0, 0, 'O'),
  putSymbol(2, 0),
  expectPutSymbol(2, 0, 'X'),
  expectPutSymbol(1, 0, 'O'),
  putSymbol(2, 1),
  expectPutSymbol(2, 1, 'X'),
  expectPutSymbol(0, 1, 'O'),
  putSymbol(2, 2),
  expectPutSymbol(2, 2, 'X'),
  expectWinner('X'),
  expectTotalScore(3)
]

describe('ttt-simple', () => {
    it('request for grade will generate 8 battles', async () => {
      const battleIds = await requestForGrade()
      expect(battleIds).toHaveLength(8)
    })

    it('gives me my position when start game', async () => {
      return startBattle(
        CaseType.BASE_AI_O,
        listenEvent(),
        expectGameStart('X')
      )
    })

    it('can receive ai movement', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O')
      )
    })

    it('can react to player movement', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        putSymbol(0, 1),
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
        listenEvent(),
        ...winSequence
      )
    })

    it('example: ai win', () => {
      // O O O
      // - - X
      // - - X
      return startBattle(
        CaseType.BASE_AI_O,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        putSymbol(2, 2),
        expectPutSymbol(2, 2, 'X'),
        expectPutSymbol(1, 0, 'O'),
        putSymbol(2, 1),
        expectPutSymbol(2, 1, 'X'),
        expectPutSymbol(2, 0, 'O'),
        expectWinner('O'),
        expectTotalScore(0)
      )
    })

    it('example: draw', () => {
      // X X O
      // O O X
      // X O O
      return startBattle(
        CaseType.BASE_AI_X,
        listenEvent(),
        expectGameStart('O'),
        putSymbol(2, 0),
        expectPutSymbol(2, 0, 'O'),
        expectPutSymbol(0, 0, 'X'),
        putSymbol(0, 1),
        expectPutSymbol(0, 1, 'O'),
        expectPutSymbol(1, 0, 'X'),
        putSymbol(1, 1),
        expectPutSymbol(1, 1, 'O'),
        expectPutSymbol(2, 1, 'X'),
        putSymbol(1, 2),
        expectPutSymbol(1, 2, 'O'),
        expectPutSymbol(0, 2, 'X'),
        putSymbol(2, 2),
        expectPutSymbol(2, 2, 'O'),
        expectWinner('DRAW'),
        expectTotalScore(0)
      )
    })

    it('flips when player X play before AI O', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        putSymbol(1, 2),
        listenEvent(),
        expectGameStart('X'),
        viewBattle(battle => {
          expect(battle.flippedBy).toEqual('O')
          expect(battle.flippedReason).toEqual('Not your turn')
        }),
        expectTotalScore(0)
      )
    })

    it('flips when player X flipped randomly', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        listenEvent(),
        expectGameStart('X'),
        receiveEvent(),
        flipTable(),
        receiveEvent((event) => {
          expect(event).toEqual({ player: 'X', action: 'flipTable' })
        }),
        receiveEvent((event) => {
          expect(event).toEqual({ player: 'O', action: 'flipTable' })
        }),
        viewBattle(battle => {
          expect(battle.flippedBy).toEqual('O')
          expect(battle.flippedReason).toEqual('You are not supposed to flip the table now')
        }),
        expectTotalScore(0)
      )
    })

    it('flips when player X put at occupied position', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        putSymbol(0, 0),
        expectPutSymbol(0, 0, 'X'),
        receiveEvent((event) => {
          expect(event).toEqual({ player: 'O', action: 'flipTable' })
        }),
        viewBattle(battle => {
          expect(battle.flippedBy).toEqual('O')
          expect(battle.flippedReason).toEqual('location 0,0 is not empty')
        }),
        expectTotalScore(0)
      )
    })

    it('flips when player X put outside of the board', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        listenEvent(),
        expectGameStart('X'),
        expectPutSymbol(0, 0, 'O'),
        putSymbol(4, 4),
        expectPutSymbol(4, 4, 'X'),
        receiveEvent((event) => {
          expect(event).toEqual({ player: 'O', action: 'flipTable' })
        }),
        viewBattle(battle => {
          expect(battle.flippedBy).toEqual('O')
          expect(battle.flippedReason).toEqual('location 4,4 is out of range')
        }),
        expectTotalScore(0)
      )
    })

    it('whole all 9 flip', () => {
      return startRun([
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable(), expectTotalScore(0)],
      ])
    })

    it('whole all 1 win', () => {
      return startRun([
        [listenEvent(),...winSequence, expectTotalScore(3)],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
        [flipTable()],
      ])
    })
  })
