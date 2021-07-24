import request from 'supertest'
import arenaApp from '../../../src/Server'
import { CaseType } from '../../../src/ttt/types'
import { allRedis } from '../../../src/redis'
import { moveWorker } from '../../../src/ttt/queues'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)

afterAll(async () => {
  await Promise.all(allRedis.map(async r => {
    await r.quit()
  }))
  await moveWorker.close()
})

const requestForGrade = async (caseType?: CaseType): Promise<string[]> => {
  const sentBattleIds: string[] = []
  mock.onPost(/tic-tac-toe/).reply((config) => {
    sentBattleIds.push(JSON.parse(config.data).battleId)
    return [200, {}]
  })
  const battleIds: string[] = await new Promise(((resolve, reject) => {
    request(arenaApp).post('/tic-tac-toe/rfg').send({
      gradeId: 'some-id',
      endpoint: `http://some-endpoint`,
      caseType
    }).end((error, res) => {
      if(error) {
        reject(error)
      } else {
        if(res.body.errors.length > 0) {
          reject(res.body.errors)
        }
        resolve(res.body.battleIds)
      }
    })
  }))
  expect(battleIds).toEqual(expect.arrayContaining(sentBattleIds))
  return battleIds
}

describe('ttt', () => {
  describe('simple', () => {
    it('request for grade will generate 8 battles', async () => {
      const battleIds = await requestForGrade()
      expect(battleIds).toHaveLength(8)
    })
  })
})
