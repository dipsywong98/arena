export interface EvaluatePayload {
  teamUrl: string
  callbackUrl: string
  runId: string
  caseType?: string
}

export interface CallbackPayload {
  runId: string
  score: number
  message: string
}
