import { isCaseType, QuoridorCaseType } from './types'
import { setBattle, setRun } from './store'
import redis from '../common/redis'
import axios from 'axios'
import { config } from './config'
import { v4 } from 'uuid'
import { shuffle } from '../common/shuffle'
import { EvaluatePayload, Run } from '../common/types'
import { reportScore } from '../common/reportScore'
import { uniq } from 'ramda'

export const generateBattlesForGrading = async (
  runId: string,
  type?: QuoridorCaseType
): Promise<string[]> => {
  return Promise.all(
    Object.entries(type !== undefined ? { [type]: config[type] } : config)
      .map(async ([type, { initialStateGenerator }]) => {
        const id = v4()
        await setBattle(redis, {
          ...initialStateGenerator(id, runId),
          type: type as QuoridorCaseType
        })
        return id
      }))
}

export async function processEvaluate<ReqBody>(payload: ReqBody & EvaluatePayload) {
  const { teamUrl, runId, caseType, callbackUrl } = payload
  const type = isCaseType(caseType) ? caseType : undefined
  const battleIds = await generateBattlesForGrading(runId, type)
  const run: Run = { battleIds, callbackUrl, id: runId, createdAt: Date.now() }
  await setRun(redis, run)
  const errors: Record<string, string> = {}
  for (const battleId of shuffle(battleIds)) {
    try {
      await axios.post(`${teamUrl.replace(/\/$/, '')}/quoridor`, { battleId })
    } catch (e) {
      errors[battleId] = e.message
      console.log(e.message, `${teamUrl.replace(/\/$/, '')}/quoridor`)
    }
  }
  if (Object.keys(errors).length > 0) {
    await setRun(redis, { ...run, errors })
    await reportScore(callbackUrl, runId, 0, uniq(Object.values(errors)).join(', '))
  }
  return { battleIds, errors }
}
