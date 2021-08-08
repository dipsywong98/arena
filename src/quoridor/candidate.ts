import { QuoridorActionType, QuoridorState } from './types'
import {
  internalizeAction,
  externalizeAction,
  applyAction,
  canPutWall,
  getWalkableNeighborCoords
} from './common'
import { initState } from './common'
import { abAgent } from './agent'
import { candidateMaker } from '../common/candidateMaker'

const agent = abAgent
const game = 'quoridor'
const apply = applyAction

export const candidate = candidateMaker({
  agent,
  game,
  apply,
  externalizeAction,
  internalizeAction,
  initState,
  valid
})

function valid(state: QuoridorState, value: any, by: any) {
  if (state.turn !== by) {
    return false
  }
  try {
    const action = internalizeAction(value)
    if (action.type === QuoridorActionType.PUT_WALL) {
      if (action.o !== undefined && canPutWall(state, action.x ?? -1, action.y ?? -1, action.o)) {
        return true
      }
      return false
    }
    if (action.type === QuoridorActionType.MOVE) {
      const x1 = action.x
      const y1 = action.y
      if (x1 !== undefined && y1 !== undefined) {
        const neighbors = getWalkableNeighborCoords(state, state.turn)
        if (neighbors.find(({ x, y }) => x === x1 && y === y1) !== undefined) {
          return true
        }
      }
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

