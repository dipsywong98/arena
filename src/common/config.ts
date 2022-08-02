export const appConfig = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'unknown',
  AUTH_TOKEN: process.env.AUTH_TOKEN ?? 'token',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
  SHOULD_START_WITHIN: Number(process.env.SHOULD_START_WITHIN ?? 300000),
  CONCURRENCY: Number(process.env.CONCURRENCY ?? 1),
  REDIS_TLS_URL: process.env.REDIS_TLS_URL,
  REDIS_URL: process.env.REDIS_URL,
  QUORIDOR_INITIAL_CLOCK_MS: Number(process.env.QUORIDOR_INITIAL_CLOCK_MS ?? 60000),
  QUORIDOR_TURN_ADD_MS: Number(process.env.QUORIDOR_TURN_ADD_MS ?? 2000),
  QUORIDOR_TERMINATE_TURNS: Number(process.env.QUORIDOR_TERMINATE_TURNS ?? 40),
  CONNECT4_TERMINATE_TURNS: Number(process.env.CONNECT4_TERMINATE_TURNS ?? 40),
  CANDIDATE_ENABLED: process.env.CANDIDATE_ENABLED,
  CALLBACK_URL_OVERRIDE: process.env.CALLBACK_URL_OVERRIDE
} as const