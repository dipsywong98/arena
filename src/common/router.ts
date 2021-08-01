// import { Router } from 'express'
// import { v4 } from 'uuid'
// import {
//   Action,
//   Battle,
//   ChallengeContext,
//   Move, START_GAME,
//   State
// } from './types'
// import logger from '../common/logger'
// import redis, { pubRedis, subRedis } from './redis'
// import { isEvaluatePayload } from './types'
//
// export const makeRouter = <A extends Action,
//   B extends Battle<CaseType, Result, S, Turn>,
//   CaseType extends string,
//   M extends Move<A, Turn>,
//   Result,
//   S extends State,
//   Turn,
//   C extends ChallengeContext<A, B, CaseType, M, Result, S, Turn>> (ctx: C): C => {
//   if (ctx.stores === undefined) {
//     throw new Error('expect stores to be present in challenge context')
//   }
//   if (ctx.queues === undefined) {
//     throw new Error('expect queues to be present in challenge context')
//   }
//   const {
//     processEvaluate,
//     TURN_ADD_MS,
//     stores: {
//       getBattle,
//       publishMessage,
//       subscribeMessage,
//       timerReset,
//       timerRead,
//       setBattle
//     },
//     queues: {
//       moveQueue,
//     }
//   } = ctx
//
//   const router = Router()
//
// // eslint-disable-next-line @typescript-eslint/no-misused-promises
//   router.post('/evaluate', async (req, res) => {
//     const payload = req.body
//     if (isEvaluatePayload(payload)) {
//       const { battleIds, errors } = await processEvaluate(payload)
//       res.send({ battleIds, errors })
//     } else {
//       res
//         .status(400)
//         .send({ error: 'missing runId, callbackUrl or teamUrl' })
//     }
//   })
//
// // eslint-disable-next-line @typescript-eslint/no-misused-promises
//   router.get('/start/:battleId', async (req, res) => {
//     const { battleId } = req.params
//     const battle = await getBattle(pubRedis, battleId)
//     if (battle === null) {
//       res.status(404).send({ error: 'battle not found' })
//       return
//     }
//     res.setHeader('Cache-Control', 'no-cache')
//     res.setHeader('Content-Type', 'text/event-stream')
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader('Connection', 'keep-alive')
//     res.flushHeaders()
//     const moveId = v4()
//     res.write(`data: ${JSON.stringify({ youAre: battle.externalPlayer, id: battleId })}\n\n`)
//
//     await subscribeMessage(subRedis, battleId, (message) => {
//       try {
//         const { action2, ...rest } = JSON.parse(message)
//         res.write(`data: ${JSON.stringify(rest)}\n\n`)
//         if (action2 !== undefined) {
//           res.write(`data: ${JSON.stringify(action2)}\n\n`)
//         }
//         // this timerReset is ok because even
//         //   if this message is published by player sending move to us
//         // player should not send another move to us immediately
//         // so next time the player send us move and we stop timer to get the elapsed time
//         // arena should have already reset the timer
//         timerReset(redis, battleId)
//       } catch (e) {
//         logger.err(e)
//       }
//     })
//     const startGameMove = {
//       action: ({ type: START_GAME } as A),
//       battleId,
//       by: battle.externalPlayer,
//       id: moveId,
//       elapsed: 0
//     } as M
//     await moveQueue.add(moveId, startGameMove)
//     res.on('close', () => {
//       res.end()
//     })
//   })
//
// // eslint-disable-next-line @typescript-eslint/no-misused-promises
//   router.post('/play/:battleId', async (req, res) => {
//     const { battleId } = req.params
//     const elapsed = await timerRead(redis, battleId)
//     const battle = await getBattle(pubRedis, battleId)
//     if (battle === null) {
//       res.status(404).send({ error: 'Battle not found' })
//       return
//     }
//     if (battle.clock - elapsed < 0) {
//       battle.clock -= elapsed
//     } else {
//       battle.clock -= elapsed
//       battle.clock += TURN_ADD_MS
//     }
//     await setBattle(redis, battle)
//     const { x, y, action } = req.body
//     const moveId = v4()
//     const move = {
//       id: moveId,
//       battleId,
//       action: { type: action, x, y },
//       by: battle.externalPlayer,
//       elapsed
//     } as M
//     await moveQueue.add(moveId, move)
//     await publishMessage(
//       pubRedis,
//       battleId,
//       {
//         player: battle.externalPlayer,
//         action,
//         x,
//         y
//       })
//
//     res.json({ message: 'received your command', moveId, clock: battle.clock })
//   })
//
//   router.get('/view/:id', (req, res) => {
//     const id = req.params.id
//     getBattle(pubRedis, id).then(game => {
//       res.json(game)
//     })
//   })
//
//   router.post('/', (req, res) => {
//     res.send('OK')
//   })
//
//   router.get('/', (req, res) => {
//     res.redirect('/')
//   })
//
//   return {
//     ...ctx,
//     router
//   }
// }
