import axios from 'axios'
import { CallbackPayload } from './ttt/types'

export const reportScore = async (
  reportUrl: string,
  runId: string,
  score: number,
  message: string
) => {
  const headers = {
    Authorization: process.env.AUTH_TOKEN ?? ''
  }
  const payload: CallbackPayload = {
    runId,
    score,
    message
  }
  console.log(reportUrl)
  await axios.post(reportUrl, payload, { headers })
}
