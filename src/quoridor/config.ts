import { initState, opposite } from './common'
import { abAgent, baseAgent } from './agent'
import { ActionType, Battle, CaseType, TestCase, Turn } from './types'
import { playerWin } from './processMove'

export const INITIAL_CLOCK_MS = 60 * 1000

const makeInitialStateGenerator = (aiTurn: Turn) =>
  (battleId: string, runId: string): Omit<Battle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: opposite(aiTurn),
    history: [initState()],
    clock: INITIAL_CLOCK_MS
  })

export const TURN_ADD_MS = 2 * 1000

export const config: Record<CaseType, TestCase> = Object.freeze({
  [CaseType.BASE_AI_BLACK]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.BLACK),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.BASE_AI_WHITE]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.WHITE),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.AB_AI_BLACK]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.BLACK),
    agent: abAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.AB_AI_WHITE]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.WHITE),
    agent: abAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [CaseType.C_AI_WHITE_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(Turn.WHITE),
    agent: () => {
      return {
        cheat: {
          type: ActionType.MOVE,
          x: 4,
          y: 1
        }
      }
    },
    score: () => {
      return 1
    }
  },
})

// TODO ensure handle move only if started
// TODO shuffle the generated battle ids
// TODO compass coordinate system
// TODO more support endpoint and auth
