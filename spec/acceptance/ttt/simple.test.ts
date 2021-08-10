import { abAgent } from '../../../src/ttt/agent'
import { TicTacToeCaseType } from '../../../src/ttt/types'
import {
  autoPlay,
  expectFlipTable,
  expectGameStart,
  expectPutSymbol,
  expectTotalScore,
  expectWinner,
  flipTable,
  listenEvent,
  play,
  putSymbol,
  receiveEvent,
  requestForGrade,
  startBattle,
  startRun,
  viewBattle
} from '../common'
import { initState } from '../../../src/ttt/config'
import { applyAction, externalizeAction, internalizeAction } from '../../../src/ttt/common'
import { checkAndLockBattle } from '../../../src/ttt/store'
import redis from '../../../src/common/redis'

const winSequence = [
  expectGameStart('X'),
  expectPutSymbol('NW', 'O'),
  putSymbol('NE'),
  expectPutSymbol('NE', 'X'),
  expectPutSymbol('N', 'O'),
  putSymbol('E'),
  expectPutSymbol('E', 'X'),
  expectPutSymbol('W', 'O'),
  putSymbol('SE'),
  expectPutSymbol('SE', 'X'),
  expectWinner('X'),
  expectTotalScore(20)
]

describe('ttt-simple', () => {
  it('request for grade will generate 8 battles', async () => {
    const battleIds = await requestForGrade('tic-tac-toe')
    expect(battleIds).toHaveLength(8)
  })

  it('gives me my position when start game', async () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(), expectGameStart('X'))
  })

  it('can receive ai movement', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'))
  })

  it('can react to player movement', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      putSymbol('W'),
      expectPutSymbol('W', 'X'),
      expectPutSymbol('N', 'O'))
  })

  it('example: player win', () => {
    // O O X
    // O - X
    // - - X
    return startBattle(
      'tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      ...winSequence
    )
  })

  it('example: ai win', () => {
    // O O O
    // - - X
    // - - X
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      putSymbol('SE'),
      expectPutSymbol('SE', 'X'),
      expectPutSymbol('N', 'O'),
      putSymbol('E'),
      expectPutSymbol('E', 'X'),
      expectPutSymbol('NE', 'O'),
      expectWinner('O'),
      expectTotalScore(0))
  })

  it('example: draw', () => {
    // X X O
    // O O X
    // X O O
    return startBattle('tic-tac-toe', TicTacToeCaseType.BASE_AI_X,
      listenEvent(),
      expectGameStart('O'),
      putSymbol('NE'),
      expectPutSymbol('NE', 'O'),
      expectPutSymbol('NW', 'X'),
      putSymbol('W'),
      expectPutSymbol('W', 'O'),
      expectPutSymbol('N', 'X'),
      putSymbol('C'),
      expectPutSymbol('C', 'O'),
      expectPutSymbol('E', 'X'),
      putSymbol('S'),
      expectPutSymbol('S', 'O'),
      expectPutSymbol('SW', 'X'),
      putSymbol('SE'),
      expectPutSymbol('SE', 'O'),
      expectWinner('DRAW'),
      expectTotalScore(0))
  })

  it('flips when player X play before AI O', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O, putSymbol('S'),
      listenEvent(),
      expectGameStart('X'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('O')
        expect(battle.flippedReason).toEqual('Not your turn')
      }),
      expectTotalScore(0))
  })

  it('flips when player X flipped randomly', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      receiveEvent(),
      flipTable(),
      expectFlipTable('X'),
      expectFlipTable('O'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('O')
        expect(battle.flippedReason).toEqual('You are not supposed to flip the table now')
      }),
      expectTotalScore(0))
  })

  it('flips when player X put at occupied position', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      putSymbol('NW'),
      expectPutSymbol('NW', 'X'),
      expectFlipTable('O'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('O')
        expect(battle.flippedReason).toEqual('location 0,0 is not empty')
      }),
      expectTotalScore(0))
  })

  it('flips when player X put outside of the board', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      putSymbol('A'),
      expectPutSymbol('A', 'X'),
      expectFlipTable('O'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('O')
        expect(battle.flippedReason).toEqual('A is not a valid position')
      }),
      expectTotalScore(0))
  })

  it('flips when player play unknown action', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      play({ something: 'idk' }),
      receiveEvent(value => {
        expect(value).toEqual({ player: 'X', something: 'idk' })
      }),
      expectFlipTable('O'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('O')
        expect(battle.flippedReason).toEqual('unknown action type')
      }),
      expectTotalScore(0))
  })

  it('flips when player play invalid json', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      play('some invalid json content'),
      receiveEvent(value => {
        expect(value).toEqual({ player: 'X', 'some invalid json content': '' })
      }),
      expectFlipTable('O'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('O')
        expect(battle.flippedReason).toEqual('unknown action type')
      }),
      expectTotalScore(0))
  })

  it('flips when player play twice a row', () => {
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      expectGameStart('X'),
      expectPutSymbol('NW', 'O'),
      (async (ctx) => { await checkAndLockBattle(redis, ctx.battleId) }),
      play({ action: 'putSymbol', position: 'N' }, { action: 'putSymbol', position: 'NE' }),
      expectPutSymbol('N', 'X'),
      expectPutSymbol('NE', 'X'),
      expectFlipTable('O'),
      viewBattle(battle => {
        expect(battle.flippedBy).toEqual('O')
        expect(battle.flippedReason).toEqual('send move before arena replies')
      }),
      expectTotalScore(0))
  })

  it('whole all 9 flip', () => {
    return startRun('tic-tac-toe', [
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
    return startRun('tic-tac-toe', [
      [listenEvent(),
      ...winSequence, expectTotalScore(20)],
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
    return startBattle('tic-tac-toe',
      TicTacToeCaseType.BASE_AI_O,
      listenEvent(),
      autoPlay({
        init: initState, apply: applyAction, agent: abAgent, externalizeAction, internalizeAction
      }),
      viewBattle(battle => {
        expect(battle.result).toEqual('X_WIN')
      }),
      expectTotalScore(20)
    )
  })
})
