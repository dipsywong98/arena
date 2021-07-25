import { CaseType } from '../../src/ttt/types'
import axios from 'axios'
import arenaApp from '../../src/Server'
import * as http from 'http'
import { allRedis } from '../../src/redis'
import { moveWorker } from '../../src/ttt/queues'
import stoppable from 'stoppable'

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
  // await new Promise((resolve, reject) => {
  //   server?.close((e) => {
  //     console.log('closed', e)
  //     resolve(true)
  //   })
  //   server?.unref();
  // })
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
