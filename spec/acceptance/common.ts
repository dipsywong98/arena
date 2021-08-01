import { TicTacToeAction, TicTacToeBattle } from '../../src/ttt/types'
import axios from 'axios'
import arenaApp from '../../src/Server'
import * as http from 'http'
import { allRedis } from '../../src/common/redis'
import { concludeWorker, moveWorker } from '../../src/ttt/queues'
import stoppable from 'stoppable'
import { v4 } from 'uuid'
import { CallbackPayload, EvaluatePayload } from '../../src/common/types'
import { quoridorConcludeWorker, quoridorMoveWorker } from '../../src/quoridor/queues'
import { QuoridorAction, QuoridorActionType } from '../../src/quoridor/types'
import { externalizeAction } from '../../src/quoridor/common'

type Event = Record<string, unknown>
type OnEvent = (event: Event, ctx: PlayContext) => void

interface PlayContext {
  game: string
  req?: http.ClientRequest
  battleId: string
  events: Event[]
  onceEvents: OnEvent[]
  runId: string
}

type Step = (ctx: PlayContext) => Promise<void>

let server: http.Server & stoppable.WithStop | undefined
const sentBattleIds: string[] = []
const port = 12345

axios.defaults.baseURL = `http://localhost:${port}`

const callbackEndpointResults: Record<string, CallbackPayload> = {}
const onCallbackCalled: Record<string, (payload: CallbackPayload) => void> = {}

beforeAll(() => {
  server = stoppable(arenaApp.listen(port), 0)
  arenaApp.post('/test/tic-tac-toe', (req, res) => {
    sentBattleIds.push(req.body.battleId)
    res.send({})
  })
  arenaApp.post('/test/callback', (req, res) => {
    const body = req.body as CallbackPayload
    callbackEndpointResults[body.runId] = body
    onCallbackCalled[body.runId]?.(body)
    res.send({})
  })
})

beforeEach(() => {
  sentBattleIds.length = 0
})

afterAll(() => {
  const noop = () => {
    // noop
  }
  allRedis.map(r => {
    r.quit().catch(noop)
  })
  moveWorker.close().catch(noop)
  concludeWorker.close().catch(noop)
  quoridorMoveWorker.close().catch(noop)
  quoridorConcludeWorker.close().catch(noop)
  server?.stop()
})

export const requestForGrade = async (
  game: string,
  runId = 'some-id'
  , caseType?: string): Promise<string[]> => {
  const payload: EvaluatePayload = {
    runId,
    callbackUrl: `http://localhost:${port}/test/callback`,
    teamUrl: `http://localhost:${port}/test`,
    caseType
  }
  const { data: { battleIds } } = await axios.post(`/${game}/evaluate`, payload)
  expect(battleIds).toEqual(expect.arrayContaining(sentBattleIds))
  return battleIds as string[]
}

export const listenEvent = (): Step => async (ctx: PlayContext) => {
  ctx.req = http.get(`http://localhost:12345/${ctx.game}/start/${ctx.battleId}`, res => {
    res.on('data', data => {
      const text = new TextDecoder('utf-8').decode(data)
      const event = JSON.parse(text.replace('data: ', ''))
      const onceEvent = ctx.onceEvents.shift()
      if (onceEvent !== undefined) {
        onceEvent(event, ctx)
      } else {
        ctx.events.push(event)
      }
    })
  })
  return Promise.resolve()
}

export const receiveEvent = (
  callback?: OnEvent
): Step => async (ctx: PlayContext) => {
  const event = ctx.events.shift()
  if (event !== undefined) {
    callback?.(event, ctx)
  } else {
    await new Promise((resolve) => {
      ctx.onceEvents.push((event) => {
        callback?.(event, ctx)
        resolve(true)
      })
    })
  }
}

export const expectGameStart = (youAre: string) =>
  receiveEvent((event, { battleId }) => {
    expect(event).toEqual({ id: battleId, youAre })
  })

export const expectPutSymbol = (position: string, player: string) =>
  receiveEvent((event) => {
    expect(event).toEqual({ action: 'putSymbol', position, player })
  })

export const expectPawnMove = (position: string, player: string) =>
  receiveEvent((event) => {
    expect(event).toEqual({
      action: QuoridorActionType.MOVE,
      position,
      player
    })
  })

export const expectWinner = (winner: string) =>
  receiveEvent((event) => {
    expect(event).toEqual({ winner })
  })

export const expectTotalScore = (expectedScore: number) => async (context: PlayContext) => {
  if (context.runId in callbackEndpointResults) {
    const actualScore = callbackEndpointResults[context.runId]?.score
    expect(actualScore).toEqual(expectedScore)
  } else {
    await new Promise((resolve => {
      onCallbackCalled[context.runId] = (payload) => {
        expect(payload.score).toEqual(expectedScore)
        resolve(0)
      }
    }))
  }
}

export const expectFlipTable = (player: string) =>
  receiveEvent((event) => {
    expect(event).toEqual({ player, action: 'flipTable' })
  })

export const play = (payload: Record<string, unknown>): Step => async (ctx: PlayContext) => {
  await axios.post(`/${ctx.game}/play/${ctx.battleId}`, payload)
}

export const putSymbol = (
  position: string
): Step => {
  return play({ action: 'putSymbol', position })
}

export const flipTable = (): Step => play({ action: 'flipTable' })

export const movePawn = (position: string): Step => play({
  action: QuoridorActionType.MOVE,
  position
})

export const viewBattle = (cb: (battle: TicTacToeBattle) => unknown): Step => (
  async (ctx: PlayContext) => {
    const battle = await axios.get(`/${ctx.game}/view/${ctx.battleId}`)
    cb(battle.data)
  })

export const setNow = (ms: number): Step => async () => {
  Date.now = jest.fn(() => ms)
  return Promise.resolve()
}

export const startBattle = async (
  game: string,
  caseType: string,
  ...steps: Step[]
): Promise<void> => {
  const runId = v4()
  const [battleId] = await requestForGrade(game, runId, caseType)
  const ctx: PlayContext = {
    game,
    battleId,
    events: [],
    onceEvents: [],
    runId
  }
  for (const step of steps) {
    await step(ctx)
  }
  ctx.req?.emit('close')
}

export const startRun = async (game: string, stepsForCases: Step[][]): Promise<void> => {
  const runId = v4()
  const battleIds = await requestForGrade(game, runId)
  expect(stepsForCases.length).toEqual(battleIds.length)
  const promises = battleIds.map(async (battleId, k) => {
    const steps = stepsForCases[k]
    const ctx: PlayContext = {
      game,
      battleId,
      events: [],
      onceEvents: [],
      runId
    }
    for (const step of steps) {
      await step(ctx)
    }
    ctx.req?.emit('close')
  })
  await Promise.all(promises)
}

export const autoPlay = <S, A extends TicTacToeAction | QuoridorAction> (
  { init, apply, agent, externalizeAction, internalizeAction }: {
    init: () => S,
    apply: (s: S, a: A) => S,
    agent: (s: S) => A,
    externalizeAction: (a: A) => any,
    internalizeAction: (a: any) => any,
  }): Step =>
  async (ctx: PlayContext) => {
    let state = init()
    let me: unknown | undefined
    let flag = false
    while (!flag) {
      await receiveEvent((value) => {
        if (value.youAre !== undefined) {
          me = value.youAre
          if (me === 'O' || me === 'first') {
            const react = agent(state)
            play({ ...externalizeAction(react), action: react.type })(ctx)
          }
        }
        if (value.action !== undefined) {
          state = apply(state, internalizeAction(value))
          if (value.player !== me) {
            const react = agent(state)
            play({ ...externalizeAction(react), action: react.type })(ctx)
          }
        }
        if (value.action === 'flipTable' || value.winner !== undefined) {
          flag = true
        }
      })(ctx)
    }
  }
