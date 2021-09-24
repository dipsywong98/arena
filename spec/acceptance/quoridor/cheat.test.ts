import {
  autoPlay,
  expectFlipTable,
  expectGameStart,
  expectPawnMove,
  expectPutWall,
  expectTotalScore,
  expectTotalScoreSomething,
  flipTable,
  listenEvent,
  movePawn,
  putWall,
  receiveEvent,
  startBattle
} from '../common'
import { QuoridorActionType, QuoridorCaseType } from '../../../src/quoridor/types'
import {
  applyAction,
  blocked,
  externalizeAction,
  initState,
  internalizeAction,
} from '../../../src/quoridor/common'
import { moveOnlyAgent } from '../../../src/quoridor/agent'

describe('quoridor-cheat', () => {
  describe('C_AI_TELEPORT', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_TELEPORT,
        listenEvent(),
        expectGameStart('first'),
        movePawn('e2'),
        expectPawnMove('e2', 'first'),
        expectPawnMove('e5', 'second'),
        movePawn('e3'),
        expectPawnMove('e3', 'first'),
        expectFlipTable('second'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_TELEPORT,
        listenEvent(),
        expectGameStart('first'),
        movePawn('e2'),
        expectPawnMove('e2', 'first'),
        expectPawnMove('e5', 'second'),
        flipTable(),
        expectFlipTable('first'),
        expectTotalScoreSomething())
    })
  })
  describe('C_AI_SECOND_FIRST', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_SECOND_FIRST,
        listenEvent(),
        expectGameStart('first'),
        expectPawnMove('e8', 'second'),
        movePawn('e2'),
        expectPawnMove('e2', 'first'),
        expectFlipTable('second'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_SECOND_FIRST,
        listenEvent(),
        expectGameStart('first'),
        expectPawnMove('e8', 'second'),
        flipTable(),
        expectFlipTable('first'),
        expectTotalScoreSomething())
    })
  })
  describe('C_AI_TWICE_A_ROW', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart('first'),
        movePawn('e2'),
        expectPawnMove('e2', 'first'),
        expectPawnMove('e8', 'second'),
        expectPawnMove('e7', 'second'),
        movePawn('e3'),
        expectPawnMove('e3', 'first'),
        expectFlipTable('second'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_TWICE_A_ROW,
        listenEvent(),
        expectGameStart('first'),
        movePawn('e2'),
        expectPawnMove('e2', 'first'),
        expectPawnMove('e8', 'second'),
        expectPawnMove('e7', 'second'),
        flipTable(),
        expectFlipTable('first'),
        expectTotalScoreSomething())
    })
  })
  describe('C_AI_WALL_OUTSIDE', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALL_OUTSIDE,
        listenEvent(),
        expectGameStart('second'),
        expectPutWall('i4h', 'first'),
        movePawn('e2'),
        expectPawnMove('e2', 'second'),
        expectFlipTable('first'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALL_OUTSIDE,
        listenEvent(),
        expectGameStart('second'),
        expectPutWall('i4h', 'first'),
        flipTable(),
        expectFlipTable('second'),
        expectTotalScoreSomething())
    })
  })
  describe('C_AI_PAWN_OUTSIDE', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_PAWN_OUTSIDE,
        listenEvent(),
        expectGameStart('first'),
        movePawn('e2'),
        expectPawnMove('e2', 'first'),
        expectPawnMove('e10', 'second'),
        movePawn('e3'),
        expectPawnMove('e3', 'first'),
        expectFlipTable('second'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_PAWN_OUTSIDE,
        listenEvent(),
        expectGameStart('first'),
        movePawn('e2'),
        expectPawnMove('e2', 'first'),
        expectPawnMove('e10', 'second'),
        flipTable(),
        expectFlipTable('first'),
        expectTotalScoreSomething())
    })
  })
  describe('C_AI_WALL_CROSS', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALL_CROSS,
        listenEvent(),
        expectGameStart('second'),
        expectPutWall('e4h', 'first'),
        movePawn('e8'),
        expectPawnMove('e8', 'second'),
        expectPutWall('e4v', 'first'),
        movePawn('e7'),
        expectPawnMove('e7', 'second'),
        expectFlipTable('first'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALL_CROSS,
        listenEvent(),
        expectGameStart('second'),
        expectPutWall('e4h', 'first'),
        movePawn('e8'),
        expectPawnMove('e8', 'second'),
        expectPutWall('e4v', 'first'),
        flipTable(),
        expectFlipTable('second'),
        expectTotalScoreSomething())
    })
  })
  describe('C_AI_WALL_BLOCKING', () => {
    it('dont flip', () => {
      const autoPlayNoFlip = autoPlay({
        init: initState,
        apply: applyAction,
        agent: moveOnlyAgent,
        externalizeAction: externalizeAction,
        internalizeAction: internalizeAction
      })
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALL_BLOCKING,
        listenEvent(),
        autoPlayNoFlip,
        expectTotalScore(0))
    }, 20000)
    it('flip', () => {
      const autoPlayWithFlip = autoPlay({
        init: initState,
        apply: applyAction,
        agent: state => {
          if (blocked(state)) {
            return {
              type: QuoridorActionType.FLIP_TABLE,
              x: 0, y: 0
            }
          }
          return moveOnlyAgent(state)
        },
        externalizeAction: externalizeAction,
        internalizeAction: internalizeAction
      })
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALL_BLOCKING,
        listenEvent(),
        autoPlayWithFlip,
        expectTotalScoreSomething())
    }, 10000)
  })
  describe('C_AI_WALK_THROUGH_WALL', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALK_THROUGH_WALL,
        listenEvent(),
        expectGameStart('second'),
        expectPutWall('e1h', 'first'),
        movePawn('e8'),
        expectPawnMove('e8', 'second'),
        expectPawnMove('e2', 'first'),
        movePawn('e7'),
        expectPawnMove('e7', 'second'),
        expectFlipTable('first'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_WALK_THROUGH_WALL,
        listenEvent(),
        expectGameStart('second'),
        expectPutWall('e1h', 'first'),
        movePawn('e8'),
        expectPawnMove('e8', 'second'),
        expectPawnMove('e2', 'first'),
        flipTable(),
        expectFlipTable('second'),
        expectTotalScore(2))
    })
  })
  describe('C_AI_PUT_11_WALLS', () => {
    it('dont flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_PUT_11_WALLS,
        listenEvent(),
        expectGameStart('first'),
        putWall('e1h'),
        expectPutWall('e1h', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        expectFlipTable('second'),
        expectTotalScore(0))
    })
    it('flip', () => {
      return startBattle('quoridor',
        QuoridorCaseType.C_AI_PUT_11_WALLS,
        listenEvent(),
        expectGameStart('first'),
        putWall('e1h'),
        expectPutWall('e1h', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        movePawn('f1'),
        expectPawnMove('f1', 'first'),
        receiveEvent(),
        movePawn('e1'),
        expectPawnMove('e1', 'first'),
        receiveEvent(),
        flipTable(),
        expectFlipTable('first'),
        expectTotalScore(2))
    })
  })

})
