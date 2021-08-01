import { initState, opposite } from './common'
import { abAgent, baseAgent } from './agent'
import {
  QuoridorActionType,
  QuoridorBattle,
  QuoridorCaseType,
  QuoridorTestCase,
  QuoridorTurn
} from './types'
import { playerWin } from './processMove'

export const INITIAL_CLOCK_MS = 60 * 1000

const makeInitialStateGenerator = (aiTurn: QuoridorTurn) =>
  (battleId: string, runId: string): Omit<QuoridorBattle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: opposite(aiTurn),
    history: [initState()],
    clock: INITIAL_CLOCK_MS
  })

export const TURN_ADD_MS = 2 * 1000

export const config: Record<QuoridorCaseType, QuoridorTestCase> = Object.freeze({
  [QuoridorCaseType.BASE_AI_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.FIRST),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [QuoridorCaseType.BASE_AI_SECOND]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [QuoridorCaseType.AB_AI_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.FIRST),
    agent: abAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [QuoridorCaseType.AB_AI_SECOND]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: abAgent,
    score: (battle) => {
      return playerWin(battle) ? 3 : 0
    }
  },
  [QuoridorCaseType.C_AI_SECOND_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: () => {
      return {
        cheat: {
          type: QuoridorActionType.MOVE,
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
