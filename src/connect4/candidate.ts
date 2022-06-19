import { Connect4ActionType, Connect4State, ExternalAction } from './types'
import { internalizeAction, externalizeAction, applyAction, isColumnFull } from './common'
import { initState } from './config'
import abAgent from './agent'
import { candidateMaker } from '../common/candidateMaker'

const agent = abAgent
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
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }
})

