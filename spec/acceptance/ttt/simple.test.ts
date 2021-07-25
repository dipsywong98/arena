import { CaseType } from '../../../src/ttt/types'
import { startBattle, receiveEvent, requestForGrade, play } from '../common'
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

    it('can receive ai movement', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        receiveEvent((event, { battleId }) => {
          expect(event).toEqual({ id: battleId, youAre: 'X' })
        }),
        receiveEvent((event) => {
          expect(event).toEqual({ type: 'putSymbol', x: 0, y: 0, player: 'O' })
        })
      )
    })

    it('can react to player movement', () => {
      return startBattle(
        CaseType.BASE_AI_O,
        receiveEvent((event, { battleId }) => {
          expect(event).toEqual({ id: battleId, youAre: 'X' })
        }),
        receiveEvent((event) => {
          expect(event).toEqual({ type: 'putSymbol', x: 0, y: 0, player: 'O' })
        }),
        play({action: 'putSymbol', x: 0, y: 1}),
        receiveEvent((event) => {
          expect(event).toEqual({ type: 'putSymbol', x: 0, y: 1, player: 'X' })
        }),
        receiveEvent((event) => {
          console.log(event)
          expect(event).toEqual({ type: 'putSymbol', x: 1, y: 0, player: 'O' })
        })
      )
    })
  })
})
