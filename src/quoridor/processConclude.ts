import { getBattle, getRun, setRun } from './store'
import { QuoridorBattle } from './types'
import redis from '../common/redis'
import { difference } from 'ramda'
import { reportScore } from '../common/reportScore'
import { ConcludeRequest } from '../common/types'

export const processConclude = async (concludeRequest: ConcludeRequest) => {
  const { runId } = concludeRequest
  const run = await getRun(redis, runId)
  if (run === null) {
    throw new Error(`no such run or expired: ${runId}`)
  }
  if (run.score !== undefined) {
    return { message: `run ${runId} already concluded the total score` }
  }
  const battles = (await Promise.all(
    run.battleIds.map(battleId => getBattle(redis, battleId))
  )).filter(battle => battle?.score !== undefined) as Array<QuoridorBattle & { score: number }>
  const done = battles.map(b => b.id)
  const missing = difference(run.battleIds, done)
  // if (battles.length !== run.battleIds.length) {
  //   return {
  //     message: `run ${run.id} has not finished its evaluation`,
  //     done,
  //     missing: missing
  //   }
  // }
  const totalScore = battles.map(battle => battle.score).reduce((a, b) => a + b, 0)
  const totalMessage = battles.map(battle => {
    return `${battle.id}: ${battle.flippedReason ?? `scored ${battle.score}`}`
  }).join('\n---------------\n') + missing.map(battleId => `${battleId}: processing`)
  await reportScore(run.callbackUrl, run.id, totalScore, totalMessage)
  const concludedRun = { ...run, score: totalScore, message: totalMessage, completedAt: Date.now() }
  await setRun(redis, concludedRun)
  return concludedRun
}
