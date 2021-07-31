import { getBattle, getRun, setRun } from './store'
import { Battle, ConcludeRequest } from './types'
import redis from '../common/redis'
import { difference } from 'ramda'
import { reportScore } from '../common/reportScore'

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
  )).filter(battle => battle?.score !== undefined) as Array<Battle & { score: number }>
  if (battles.length !== run.battleIds.length) {
    const done = battles.map(b => b.id)
    return {
      message: `run ${run.id} has not finished its evaluation`,
      done,
      missing: difference(run.battleIds, done)
    }
  }
  const totalScore = battles.map(battle => battle.score).reduce((a, b) => a + b, 0)
  const totalMessage = battles.map(battle => {
    return `${battle.id}: ${battle.flippedReason ?? `scored ${battle.score}`}`
  }).join('\n---------------\n')
  await reportScore(run.callbackUrl, run.id, totalScore, totalMessage)
  const concludedRun = { ...run, score: totalScore, message: totalMessage }
  await setRun(redis, concludedRun)
  return concludedRun
}
