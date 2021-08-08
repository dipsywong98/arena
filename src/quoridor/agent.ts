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

const scorer = (me: QuoridorTurn) => (state: QuoridorState): number => {
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
    throw new Error(`why this happened, no path for ${me}`)
  }
  const plq = pathLength(state, opposite(me))
  if (plq === -1) {
    throw new Error(`why this happened, no path for ${opposite(me)}`)
  } // dont select this
  const plmax = SIZE * SIZE
  return (plmax - plp) / plmax - (plmax - plq) / plmax
}

const preferBlockingScorer = (me: QuoridorTurn) => (state: QuoridorState): number => {
  try {
    return scorer(me)(state)
  } catch (e) {
    return 1000
  }
}

const generator = (state: QuoridorState): QActionInternal[] => {
  const neighbors = getWalkableNeighborCoords(state, state.turn)
    .map(({ x, y }) => ({ x, y, type: QuoridorActionType.MOVE }))
  const walls = state.players[state.turn].walls > 0 ? shuffle(allPossibleWalls(state)) : []
  return neighbors.concat(walls)
}

const moveOnlyGenerator = (state: QuoridorState): QActionInternal[] => {
  return getWalkableNeighborCoords(state, state.turn)
    .map(({ x, y }) => ({ x, y, type: QuoridorActionType.MOVE }))
}

const blockingWallGenerator = (state: QuoridorState): QActionInternal[] => {
  const neighbors = getWalkableNeighborCoords(state, state.turn)
    .map(({ x, y }) => ({ x, y, type: QuoridorActionType.MOVE }))
  const walls = state.players[state.turn].walls > 0 ? shuffle(allPossibleWalls(state, isWallNotOverlap)) : []
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
  } catch (e) {
    logger.err('error occured in abtree and fall back to baseAgent', e)
    return moveOnlyAgent(state)
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
  } catch (e) {
    logger.err('error occured in abtree and fall back to baseAgent', e)
    return baseAgent(state)
  }
}


export const blockingWallAgent = (state: QuoridorState): QActionInternal | { cheat: QActionInternal } => {
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
