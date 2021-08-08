import { isCaseType, TicTacToeCaseType } from './types'
import { setBattle, setRun } from './store'
import { pubRedis } from '../common/redis'
import axios from 'axios'
import { config } from './config'
import { v4 } from 'uuid'
import { shuffle } from '../common/shuffle'
import { EvaluatePayload, Run } from '../common/types'

export const generateBattlesForGrading = async (
  runId: string,
  type?: TicTacToeCaseType
): Promise<string[]> => {
  return Promise.all(
    Object.entries(type !== undefined ? { [type]: config[type] } : config)
      .map(async ([type, { initialStateGenerator }]) => {
        const id = v4()
        await setBattle(pubRedis, {
          ...initialStateGenerator(id, runId),
          type: type as TicTacToeCaseType
        })
        return id
      }))
}

export async function processEvaluate<ReqBody> (payload: ReqBody & EvaluatePayload) {
  const { teamUrl, runId, caseType, callbackUrl } = payload
  const type = isCaseType(caseType) ? caseType : undefined
  const battleIds = await generateBattlesForGrading(runId, type)
  const run: Run = { battleIds, callbackUrl, id: runId, createdAt: Date.now() }
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
