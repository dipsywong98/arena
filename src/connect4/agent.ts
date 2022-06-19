import { alphaBetaTree } from '../common/AlphaBetaTree'
import { applyAction, isColumnFull, isEndGame, isPlayerWin, opposite, WIDTH } from './common'
import { Connect4Action, Connect4ActionType, Connect4State, Connect4Turn } from './types'

const scorer = (me: Connect4Turn) => (state: Connect4State): number => {
  if (isPlayerWin(state, me)) {
    return 100
  }
  if (isPlayerWin(state, opposite(me))){
    return -100
  }
  return 0
}

const generator = (state: Connect4State): Connect4Action[] => {
  const moves: Connect4Action[] = []
  for (let i = 0; i < WIDTH; i++) {
    if (!isColumnFull(state, i)) {
      moves.push({ type: Connect4ActionType.PUT_TOKEN, column: i })
    }
  }
  return moves
}

export type Connect4Agent = (state: Connect4State) => Connect4Action

export const baseAgent: Connect4Agent = (state) => {
  const moves = generator(state)
  if (moves.length > 0) {
    return moves[Math.floor(Math.random() * moves.length)]
  }
  return {
    type: Connect4ActionType.END_GAME
  }
}

export const abAgent: Connect4Agent = (state): Connect4Action => {
  return alphaBetaTree({
    state,
    generator,
    isEndGame,
    scorer: scorer(state.turn),
    depth: 9,
    maximize: true,
    alpha: -Infinity,
    beta: Infinity,
    apply: applyAction
  }).action ?? baseAgent(state)
}

export default abAgent
