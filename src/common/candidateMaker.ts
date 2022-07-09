import axios from "axios"
import http from "http"
import https from "https"
import { TicTacToeActionType } from "../ttt/types"
import { ARENA_URL, FLIP_TABLE } from "./constants"
import logger from "./logger"
import { Action, State } from "./types"


interface Candidate<S extends State, A extends Action> {
  agent: (s: S) => A
  game: string
  apply: (s: S, a: A) => S
  externalizeAction: (a: A) => Record<string, unknown>
  internalizeAction: (a: any) => any
  initState: () => S
  valid: (s: S, a: any, player: string) => boolean
}

export const candidateMaker = <S extends State, A extends Action>({
  agent, game, apply, externalizeAction, internalizeAction, initState, valid
}: Candidate<S, A>) => {
  const queue: string[] = []
  const start = (battleId: string) => {
    logger.info('candidate start ' + battleId)
    let timeout: NodeJS.Timeout | undefined
    const play = (payload: unknown) => new Promise((resolve) => {
      timeout = setTimeout(() => {
        axios.post(`${ARENA_URL}/${game}/play/${battleId}`, payload)
        .then(resolve)
        .catch((e) => console.log(e.message ?? e))
      }, 500)
    })
    const dequeue = () => {
      queue.shift()
      if (queue.length > 0) {
        start(queue[0])
      }
    }
    const req = (ARENA_URL.startsWith('https://') ? https : http)
      .get(`${ARENA_URL}/${game}/start/${battleId}`, res => {
        let state = initState()
        let me: unknown | undefined
        res.on('data', data => {
          const text = new TextDecoder('utf-8').decode(data)
          try {
            const value = JSON.parse(text.replace('data: ', ''))
            if (value.action === FLIP_TABLE
              || value.winner !== undefined) {
              play({ action: TicTacToeActionType.FLIP_TABLE })
              req.end()
              dequeue()
            } else if (value.youAre !== undefined) {
              me = value.youAre
              if (me === 'O' || me === 'first' || me === '🔴') {
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
                    dequeue()
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
          } catch (err: any) {
            logger.err(err.message ?? err)
          }
        })
      })
  }
  return (battleId: string) => {
    queue.push(battleId)
    if (queue.length === 1) {
      start(battleId)
    }
  }
}