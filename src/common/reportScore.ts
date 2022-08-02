import axios from 'axios'
import { appConfig } from './config'
import { CallbackPayload } from './types'

export const reportScore = async (
  reportUrl: string,
  runId: string,
  score: number,
  message: string
) => {
  const headers = {
    Authorization: appConfig.AUTH_TOKEN ?? ''
  }
  const payload: CallbackPayload = {
    runId,
    score,
    message
  }
  await axios.post(reportUrl, payload, { headers })
}
