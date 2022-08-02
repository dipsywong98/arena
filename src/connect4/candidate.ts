import { Connect4ActionType, Connect4State, ExternalAction } from './types'
import { internalizeAction, externalizeAction, applyAction, isColumnFull } from './common'
import { initState } from './config'
import { candidateMaker } from '../common/candidateMaker'
import bestAgent from './bestAgent'

const agent = bestAgent
const game = 'connect4'
const apply = applyAction

export const candidate = candidateMaker({
  agent,
  game,
  apply,
  externalizeAction,
  internalizeAction,
  initState,
  valid: (state, value, by) => {
    if (state.turn !== by) {
      return false
    }
    try {
      const action = internalizeAction(value)
      if (action.type === Connect4ActionType.PUT_TOKEN) {
        if (action.column !== undefined && !isColumnFull(state, action.column)) {
          return true
        } else {
          return false
        }
      }
      return false;
    } catch (err) {
      return false
    }
  }
})

