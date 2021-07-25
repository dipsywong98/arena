import { CaseType } from '../../src/ttt/types'
import axios from 'axios'
import arenaApp from '../../src/Server'
import * as http from 'http'
import { allRedis } from '../../src/redis'
import { moveWorker } from '../../src/ttt/queues'
import stoppable from 'stoppable'
import produce from 'immer'

let server: http.Server & stoppable.WithStop | undefined
const sentBattleIds: string[] = []
const port = 12345

axios.defaults.baseURL = `http://localhost:${port}`

beforeAll(() => {
  server = stoppable(arenaApp.listen(port), 0)
  arenaApp.post('/test/tic-tac-toe', (req, res) => {
    sentBattleIds.push(req.body.battleId)
    res.send({})
  })
})

beforeEach(() => {
  sentBattleIds.length = 0
})

afterAll(async () => {
  await Promise.all(allRedis.map(async r => {
    try {
      await r.quit()
    } catch (e) {
      // no op
    }
  }))
  try {
    await moveWorker.close()
  } catch (e) {
    // op op
  }
  server?.stop(() => {
    console.log('stopped')
  })
})

export const requestForGrade = async (caseType?: CaseType): Promise<string[]> => {
  const { data: { battleIds } } = await axios.post(`/tic-tac-toe/rfg`, {
    gradeId: 'some-id',
    endpoint: `http://localhost:${port}/test`,
    caseType
  })
  expect(battleIds).toEqual(expect.arrayContaining(sentBattleIds))
  return battleIds as string[]
}

type Event = Record<string, unknown>
type OnEvent = (event: Event, ctx: PlayContext) => void

interface PlayContext {
  battleId: string
  events: Event[]
  onceEvents: OnEvent[]
}


type Step = (ctx: PlayContext) => Promise<void>

export const receiveEvent = (
  callback: OnEvent
):Step => async (ctx: PlayContext) => {
  const event = ctx.events.pop()
  if (event !== undefined) {
    callback(event, ctx)
  } else {
    await new Promise((resolve) => {
      ctx.onceEvents.push((event) => {
        callback(event, ctx)
        resolve(true)
      })
    })
  }
}

export const play = (
  payload: Event
):Step => async (ctx: PlayContext) => {
  await axios.post(`/tic-tac-toe/play/${ctx.battleId}`, payload)
}

export const startBattle = async (caseType: CaseType, ...steps: Step[]): Promise<void> => {
  const [battleId] = await requestForGrade(caseType)
  const ctx: PlayContext = {
    battleId,
    events: [],
    onceEvents: []
  }
  const req = http.get(`http://localhost:12345/tic-tac-toe/start/${battleId}`, res => {
    res.on('data', data => {
      const text = new TextDecoder('utf-8').decode(data)
      const event = JSON.parse(text.replace('data: ', ''))
      const onceEvent = ctx.onceEvents.pop()
      if (onceEvent !== undefined) {
        onceEvent(event, ctx)
      } else {
        ctx.events.push(event)
      }
    })
  })
  for(const step of steps) {
    await step(ctx)
  }
  req.emit('close')
}
