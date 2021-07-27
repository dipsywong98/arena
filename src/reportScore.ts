import axios from 'axios'

export const reportScore = async (
  reportUrl: string,
  runId: string,
  score: number,
  message: string
) => {
  const headers = {
    Authorization: process.env.AUTH_TOKEN
  }
  await axios.post(reportUrl, {
    runId,
    score,
    message
  }, { headers })
}
