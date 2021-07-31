export interface EvaluatePayload {
  teamUrl: string
  callbackUrl: string
  runId: string
  caseType?: string
}

export function isEvaluatePayload (payload: unknown | EvaluatePayload): payload is EvaluatePayload {
  return typeof payload === 'object'
    && payload !== null
    && 'teamUrl' in payload
    && 'callbackUrl' in payload
    && 'runId' in payload
}

export interface CallbackPayload {
  runId: string
  score: number
  message: string
}
