import { allPossibleWalls, compressState, initState, opposite } from './common'
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
import { appConfig } from '../common/config'

export const INITIAL_CLOCK_MS = appConfig.QUORIDOR_INITIAL_CLOCK_MS

export const TURN_ADD_MS = appConfig.QUORIDOR_TURN_ADD_MS

// would directly call the score function for score
export const TERMINATE_TURNS = appConfig.QUORIDOR_TERMINATE_TURNS

const makeInitialStateGenerator = (aiTurn: QuoridorTurn) =>
  (battleId: string, runId: string): Omit<QuoridorBattle, 'type'> => ({
    id: battleId,
    runId,
    externalPlayer: opposite(aiTurn),
    history: [compressState(initState())],
    moves: [],
    clock: INITIAL_CLOCK_MS,
    createdAt: Date.now()
  })

export const turnsToScore = (turns: number, maxTurns: number): number => {
  if (turns < 8) {
    return 0
  } else if (turns < 14) {
    return 1
  } else if (turns < 18) {
    return 3
  } else if (turns < 22) {
    return 6
  } else if (turns >= maxTurns) {
    return 25
  } else {
    return 10 + Math.floor((turns - 22) / (maxTurns - 22) * 15)
  }
}

const abAiScore = (battle: QuoridorBattle) => {
  if (playerWin(battle)) {
    return 25
  }
  const turns = Math.floor(battle.history.length / 2)
  return turnsToScore(turns, TERMINATE_TURNS)
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
      return 2
    }
  },
  [QuoridorCaseType.C_AI_WALL_BLOCKING]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: blockingWallAgent,
    score: () => {
      return 4
    }
  },
  [QuoridorCaseType.C_AI_WALK_THROUGH_WALL]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.FIRST),
    agent: (state) => {
      if (state.players[QuoridorTurn.FIRST].walls === 10) {
        return {
          type: QuoridorActionType.PUT_WALL,
          x: 4,
          y: 7,
          o: Orientation.HORIZONTAL
        }
      } else {
        return {
          cheat: {
            type: QuoridorActionType.MOVE,
            x: 4,
            y: 7
          }
        }
      }
    },
    score: () => {
      return 2
    }
  },
  [QuoridorCaseType.C_AI_PUT_11_WALLS]: {
    initialStateGenerator: makeInitialStateGenerator(QuoridorTurn.SECOND),
    agent: (state) => {
      const walls = allPossibleWalls(state)
      const wall = walls[Math.floor(Math.random() * walls.length)]
      if (state.players[state.turn].walls > 0) {
        return wall
      } else {
        return {
          cheat: wall
        }
      }
    },
    score: () => {
      return 2
    }
  }
})
