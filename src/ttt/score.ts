import { getBattle, getRun, setRun } from './store'
import { Battle, Score } from './types'
import redis from '../redis'
import { difference } from 'ramda'
import { reportScore } from '../reportScore'

export const handleScore = async (score: Score) => {
  const { runId } = score
  const run = await getRun(redis, runId)
  if (run === null) {
    throw new Error(`no such run or expired: ${runId}`)
  }
  if (run.score !== undefined) {
    return { message: 'score already calculated' }
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
  const enrichedRun = { ...run, score: totalScore, message: totalMessage }
  await setRun(redis, enrichedRun)
  return enrichedRun
}
