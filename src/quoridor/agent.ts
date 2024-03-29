import { QActionInternal, QuoridorActionType, QuoridorState, QuoridorTurn } from './types'
import {
  allPossibleWalls,
  applyAction,
  blocked,
  getWalkableNeighborCoords,
  isEndGame,
  isWallNotOverlap,
  opposite,
  pathLength,
  SIZE
} from './common'
import { alphaBetaTree } from '../common/AlphaBetaTree'
import logger from '../common/logger'
import { shuffle } from '../common/shuffle'

const scorer = (me: QuoridorTurn, blockScore = NaN) => (state: QuoridorState): number => {
  const { y } = state.players[state.turn]
  const enemy = state.players[opposite(state.turn)]
  const targetYp = me === QuoridorTurn.FIRST ? 0 : SIZE - 1
  const targetYq = SIZE - 1 - targetYp
  if (y === targetYp) {
    return 1000
  }
  if (enemy.y === targetYq) {
    return -1000
  }
  // manhattan distance
  // const mdp = Math.abs(targetYp - y)
  // const mdq = Math.abs(targetYq - enemy.y)
  // path length
  const plp = pathLength(state, me)
  if (plp === -1) {
    if (blockScore !== blockScore) {
      throw new Error(`why this happened, no path for ${me}`)
    } else {
      return blockScore
    }
  }
  const plq = pathLength(state, opposite(me))
  if (plq === -1) {
    if (blockScore !== blockScore) {
      throw new Error(`why this happened, no path for ${opposite(me)}`)
    } else {
      return blockScore
    }
  } // dont select this
  const plmax = SIZE * SIZE
  return (plmax - plp) / plmax - (plmax - plq) / plmax
}

const preferBlockingScorer = (me: QuoridorTurn) => (state: QuoridorState): number => {
  try {
    return scorer(me, 1000)(state)
  } catch (e) {
    return 1000
  }
}

const generator = (state: QuoridorState): QActionInternal[] => {
  const neighbors = getWalkableNeighborCoords(state, state.turn)
    .map(({ x, y }) => ({ x, y, type: QuoridorActionType.MOVE }))
  const hasWallLeft = state.players[state.turn].walls > 0
  const walls = hasWallLeft ? shuffle(allPossibleWalls(state)) : []
  return neighbors.concat(walls)
}

const moveOnlyGenerator = (state: QuoridorState): QActionInternal[] => {
  return getWalkableNeighborCoords(state, state.turn)
    .map(({ x, y }) => ({ x, y, type: QuoridorActionType.MOVE }))
}

const blockingWallGenerator = (state: QuoridorState): QActionInternal[] => {
  const neighbors = getWalkableNeighborCoords(state, state.turn)
    .map(({ x, y }) => ({ x, y, type: QuoridorActionType.MOVE }))
  const haveWallLeft = state.players[state.turn].walls > 0
  const walls = haveWallLeft ? shuffle(allPossibleWalls(state, isWallNotOverlap)) : []
  return walls.concat(neighbors)
}

export const baseAgent = (state: QuoridorState): QActionInternal => {
  const moves = generator(state)
  return moves[Math.floor(Math.random() * moves.length)]
}

export const abAgent = (state: QuoridorState): QActionInternal => {
  try {
    const alphaBetaTreeResult = alphaBetaTree({
      state,
      generator,
      isEndGame,
      scorer: scorer(state.turn),
      depth: 2,
      maximize: true,
      alpha: -Infinity,
      beta: Infinity,
      apply: applyAction
    })
    return alphaBetaTreeResult.action ?? baseAgent(state)
  } catch (e: any) {
    logger.err('Quoridor abAgent: error occured in abtree and fall back to moveOnlyAgent ')
    return moveOnlyAgent({ ...state, abtreeError: true })
  }
}

export const moveOnlyAgent = (state: QuoridorState): QActionInternal => {
  try {
    const alphaBetaTreeResult = alphaBetaTree({
      state,
      generator: moveOnlyGenerator,
      isEndGame,
      scorer: scorer(state.turn),
      depth: 2,
      maximize: true,
      alpha: -Infinity,
      beta: Infinity,
      apply: applyAction
    })
    return alphaBetaTreeResult.action ?? baseAgent(state)
  } catch (e: any) {
    logger.err(
      'Quoridor moveOnlyAgent: error occured in abtree and fall back to baseAgent ' + e.message
    )
    return baseAgent({ ...state, moveOnlyTreeError: true })
  }
}

type QActionInternalOrCheat = QActionInternal | { cheat: QActionInternal }
export const blockingWallAgent = (state: QuoridorState): QActionInternalOrCheat => {
  try {
    const alphaBetaTreeResult = alphaBetaTree({
      state,
      generator: blockingWallGenerator,
      isEndGame,
      scorer: preferBlockingScorer(state.turn),
      depth: 2,
      maximize: true,
      alpha: -Infinity,
      beta: Infinity,
      apply: applyAction
    })
    const action = alphaBetaTreeResult.action
    if (action === undefined) {
      return baseAgent(state)
    } else {
      const nextState = applyAction(state, action)
      if (blocked(nextState)) {
        return {
          cheat: action
        }
      }
      return action
    }
  } catch (e) {
    logger.err(e)
    return baseAgent(state)
  }
}
