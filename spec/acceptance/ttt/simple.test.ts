import { CaseType } from '../../../src/ttt/types'
import { requestForGrade } from '../common'
import * as http from 'http'

describe('ttt', () => {
  describe('simple', () => {
    it('request for grade will generate 8 battles', async () => {
      const battleIds = await requestForGrade()
      expect(battleIds).toHaveLength(8)
    })

    it('gives me my position when start game', async () => {
      const [battleId] = await requestForGrade(CaseType.BASE_AI_O)
      await new Promise((resolve) => {
        const req = http.get(`http://localhost:12345/tic-tac-toe/start/${battleId}`, res => {
          res.on('data', data => {
            const text = new TextDecoder('utf-8').decode(data)
            const message = JSON.parse(text.replace('data: ', ''))
            expect(message).toEqual({ id: battleId, youAre: 'X' })
            req.emit('close')
            resolve(true)
          })
        })
      })
    })
  })
})
