import axios from "axios"
import http from "http"
import https from "https"
import { TicTacToeActionType } from "../ttt/types"
import { arenaUrl } from "./constants"
import logger from "./logger"
import { Action, State } from "./types"


interface Candidate<S extends State, A extends Action> {
  agent: (s: S) => A
  game: string
  apply: (s: S, a: A) => S
  externalizeAction: (a: A) => Record<string, unknown>
  internalizeAction: (a: any) => any
  initState: () => S
  valid: (s: S, a: A, player: string) => boolean
}

export const candidateMaker = <S extends State, A extends Action>({
  agent, game, apply, externalizeAction, internalizeAction, initState, valid
}: Candidate<S, A>) => (battleId: string) => {
  let timeout: NodeJS.Timeout | undefined
  const play = (payload: unknown) => {
    timeout = setTimeout(() => {
      axios.post(`${arenaUrl}/${game}/play/${battleId}`, payload)
    }, 500)
  }
  const req = (arenaUrl.startsWith('https://') ? https : http)
    .get(`${arenaUrl}/${game}/start/${battleId}`, res => {
      let state = initState()
      let me: unknown | undefined
      res.on('data', data => {
        const text = new TextDecoder('utf-8').decode(data)
        try {
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
        } catch (err) {
          logger.err(err)
        }
      })
    })
}