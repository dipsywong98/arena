import { QActionInternal, QuoridorActionType, QuoridorState, QuoridorTurn } from './types'
import {
  allPossibleWalls,
  applyAction,
  getWalkableNeighborCoords,
  isEndGame,
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
    throw new Error('why this happened')
    }
  const plq = pathLength(state, opposite(me))
  if (plq === -1) {
    throw new Error('why this happened')
  } // dont select this
  const plmax = SIZE * SIZE
  return (plmax - plp) / plmax - (plmax - plq) / plmax
}

const generator = (state: QuoridorState): QActionInternal[] => {
  const neighbors = getWalkableNeighborCoords(state, state.turn)
    .map(({x, y}) => ({x,y,type: QuoridorActionType.MOVE}))
  const walls = state.players[state.turn].walls > 0 ? shuffle(allPossibleWalls(state)) : []
  return neighbors.concat(walls)
}

const moveOnlyGenerator = (state: QuoridorState): QActionInternal[] => {
  return getWalkableNeighborCoords(state, state.turn)
    .map(({ x, y }) => ({ x, y, type: QuoridorActionType.MOVE }))
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
    logger.err(e)
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
    logger.err(e)
    return baseAgent(state)
  }
}
