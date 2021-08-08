import { TicTacToeActionType, TicTacToeState } from './types'
import { internalizeAction, externalizeAction, applyAction } from './common'
import { initState } from './config'
import abAgent from './agent'
import { candidateMaker } from '../common/candidateMaker'

const agent = abAgent
const game = 'tic-tac-toe'
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

function valid(state: TicTacToeState, value: any, by: any) {
  if (state.turn !== by) {
    return false
  }
  try {
    const action = internalizeAction(value)
    if (action.type === TicTacToeActionType.PUT_SYMBOL) {
      if (state.board[action.y ?? -1][action.x ?? -1] === null) {
        return true
      } else {
        return false
      }
    }
    return true
  } catch (err) {
    return false
  }
}

