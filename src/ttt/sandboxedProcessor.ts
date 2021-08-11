import { SandboxedJob } from 'bullmq'
import { processMove } from './processMove'

module.exports = async (job: SandboxedJob) => {
  const move = job.data
  return await processMove(move)
}
