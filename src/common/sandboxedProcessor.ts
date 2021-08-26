import { SandboxedJob } from 'bullmq'
import { processMove } from './processMove'

module.exports = async (job: SandboxedJob) => {
  return await processMove(job.data)
}
