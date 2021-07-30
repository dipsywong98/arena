import { CaseType, EvaluatePayload, isCaseType, Run } from './types'
import { setBattle, setRun } from './store'
import { pubRedis } from '../redis'
import axios from 'axios'
import { config } from './config'
import { v4 } from 'uuid'

export const generateBattlesForGrading = async (
  runId: string,
  type?: CaseType
): Promise<string[]> => {
  return Promise.all(
    Object.entries(type !== undefined ? { [type]: config[type] } : config)
      .map(async ([type, { initialStateGenerator }]) => {
        const id = v4()
        await setBattle(pubRedis, {
          ...initialStateGenerator(id, runId),
          type: type as CaseType
        })
        return id
      }))
}

const shuffle = <T>(array: T[]) => {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function processEvaluate<ReqBody> (payload: ReqBody & EvaluatePayload) {
  const { teamUrl, runId, caseType, callbackUrl } = payload
  const type = isCaseType(caseType) ? caseType : undefined
  const battleIds = await generateBattlesForGrading(runId, type)
  const run: Run = { battleIds, callbackUrl, id: runId }
  await setRun(pubRedis, run)
  const errors = []
  for (const battleId of shuffle(battleIds)) {
    try {
      await axios.post(`${teamUrl.replace(/\/$/, '')}/tic-tac-toe`, { battleId })
    } catch (e) {
      errors.push(e.message)
    }
  }
  return { battleIds, errors }
}
