import { compressState, initState, opposite } from './common'
import { abAgent, baseAgent, blockingWallAgent } from './agent'
import {
  Orientation,
  QuoridorActionType,
  QuoridorBattle,
  QuoridorCaseType,
  QuoridorTestCase,
  QuoridorTurn
} from './types'
import { playerWin } from './processMove'

export const INITIAL_CLOCK_MS = parseInt(process.env.QUORIDOR_INITIAL_CLOCK_MS ?? '60000')

export const TURN_ADD_MS = parseInt(process.env.QUORIDOR_TURN_ADD_MS ?? '2000')

// would directly call the score function for score
export const TERMINATE_TURNS = parseInt(process.env.QUORIDOR_TERMINATE_TURNS ?? '40')

const makeInitialStateGenerator = (aiTurn: QuoridorTurn) =>
  (battleId: string, runId: string): Omit<QuoridorBattle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: opposite(aiTurn),
    history: [compressState(initState())],
    clock: INITIAL_CLOCK_MS,
    createdAt: Date.now()
  })

const abAiScore = (battle: QuoridorBattle) => {
  if (playerWin(battle)) {
    return 25
  }
  const turns = Math.floor(battle.history.length / 2)
  if (turns < 5) {
    return 0
  } else if (turns < 10) {
    return 1
  } else if (turns < 15) {
    return 3
  } else if (turns < 20) {
    return 6
  } else if (turns >= 35) {
    return 25
  } else {
    return 10 + turns - 20
  }
}

export const config: Record<QuoridorCaseType, QuoridorTestCase> = Object.freeze({
  [QuoridorCaseType.BASE_AI_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.FIRST),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 15 : 0
    }
  },
  [QuoridorCaseType.BASE_AI_SECOND]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: baseAgent,
    score: (battle) => {
      return playerWin(battle) ? 15 : 0
    }
  },
  [QuoridorCaseType.AB_AI_FIRST]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.FIRST),
    agent: abAgent,
    score: abAiScore
  },
  [QuoridorCaseType.AB_AI_SECOND]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: abAgent,
    score: abAiScore
  },
  [QuoridorCaseType.C_AI_TELEPORT]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: () => {
      return {
        cheat: {
          type: QuoridorActionType.MOVE,
          x: 4,
          y: 4
        }
      }
    },
    score: () => {
      return 2
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
      return 2
    }
  },
  [QuoridorCaseType.C_AI_TWICE_A_ROW]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: () => {
      return {
        cheat: {
          type: QuoridorActionType.MOVE,
          x: 4,
          y: 1,
          action2: {
            type: QuoridorActionType.MOVE,
            x: 4,
            y: 2
          }
        }
      }
    },
    score: () => {
      return 2
    }
  },
  [QuoridorCaseType.C_AI_WALL_OUTSIDE]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.FIRST),
    agent: () => {
      return {
        cheat: {
          type: QuoridorActionType.PUT_WALL,
          x: 8,
          y: 4,
          o: Orientation.HORIZONTAL
        }
      }
    },
    score: () => {
      return 2
    }
  },
  [QuoridorCaseType.C_AI_PAWN_OUTSIDE]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: () => {
      return {
        cheat: {
          type: QuoridorActionType.MOVE,
          x: 4,
          y: -1
        }
      }
    },
    score: () => {
      return 2
    }
  },
  [QuoridorCaseType.C_AI_WALL_CROSS]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.FIRST),
    agent: (state) => {
      if (state.players[QuoridorTurn.FIRST].walls === 10) {
        return {
          type: QuoridorActionType.PUT_WALL,
          x: 4,
          y: 4,
          o: Orientation.HORIZONTAL
        }
      } else {
        return {
          cheat: {
            type: QuoridorActionType.PUT_WALL,
            x: 4,
            y: 4,
            o: Orientation.VERTICAL
          }
        }
      }
    },
    score: () => {
      return 4
    }
  },
  [QuoridorCaseType.C_AI_WALL_BLOCKING]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: blockingWallAgent,
    score: () => {
      return 6
    }
  },
})
