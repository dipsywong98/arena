import http from 'http'
import { TicTacToeActionType, TicTacToeState } from './types'
import { internalizeAction, externalizeAction, applyAction } from './common'
import { initState } from './config'
import abAgent from './agent'
import axios from 'axios'
import { arenaUrl } from '../common/constants'

const agent = abAgent
const game = 'tic-tac-toe'
const apply = applyAction

export const candidate = (battleId: string) => {
  let timeout: NodeJS.Timeout | undefined
  const play = (payload: unknown) => {
    timeout = setTimeout(() => {
      axios.post(`${arenaUrl}/${game}/play/${battleId}`, payload)
    }, 500)
  }
  const req = http.get(`${arenaUrl}/${game}/start/${battleId}`, res => {
    let state = initState()
    let me: unknown | undefined
    res.on('data', data => {
      const text = new TextDecoder('utf-8').decode(data)
      const value = JSON.parse(text.replace('data: ', ''))
      if (value.action === 'flipTable' || value.winner !== undefined) {
        req.end()
      } else if (value.youAre !== undefined) {
        me = value.youAre
        if (me === 'O' || me === 'first') {
          const react = agent(state)
          play({ ...externalizeAction(react), action: react.type })
        }
      } else if (value.action !== undefined) {
        if (valid(state, value, value.player)) {
          state = apply(state, internalizeAction(value))
          if (value.player !== me) {
            const react = agent(state)
            if (react.type === TicTacToeActionType.END_GAME) {
              req.end()
            } else {
              play({ ...externalizeAction(react), action: react.type })
            }
          }
        } else {
          if (timeout !== undefined) {
            clearTimeout(timeout)
          }
          play({ action: TicTacToeActionType.FLIP_TABLE })
        }
      }
    })
  })
}

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
  } catch (err) {
    return false
  }
}

