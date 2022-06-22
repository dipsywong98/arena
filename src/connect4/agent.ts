import { alphaBetaTree } from '../common/AlphaBetaTree'
import {
  applyAction,
  HEIGHT,
  isColumnFull,
  isEndGame,
  isPlayerWin,
  opposite,
  WIDTH
} from './common'
import { getRandomMove } from './getRandomMove'
import {
  Connect4Board,
  Connect4Action,
  Connect4ActionType,
  Connect4State,
  Connect4Turn,
  Connect4Cell
} from './types'

type Section = [Connect4Cell, Connect4Cell, Connect4Cell, Connect4Cell]

interface Cache {
  sections: Section[]
}

function getSections(board: Connect4Board): Section[] {
  // Returns all possible sections of 4 positions that could result in a win
  const sections: Section[] = [];
  for (let j = 0; j < HEIGHT; j++) {
    for (let i = 0; i < WIDTH - 3; i++) {
      sections.push([
        board[j][i],
        board[j][i + 1],
        board[j][i + 2],
        board[j][i + 3]
      ])
    }
  }

  // check vertical
  for (let i = 0; i < WIDTH; i++) {
    for (let j = 0; j < HEIGHT - 3; j++) {
      sections.push([
        board[j][i],
        board[j + 1][i],
        board[j + 2][i],
        board[j + 3][i]
      ])
    }
  }

  // ascending diagonal
  for (let i = 0; i < WIDTH - 3; i++) {
    for (let j = 0; j < HEIGHT - 3; j++) {
      sections.push([
        board[j][i],
        board[j + 1][i + 1],
        board[j + 2][i + 2],
        board[j + 3][i + 3]
      ])
    }
  }

  // descending diagonal
  for (let i = 0; i < WIDTH - 3; i++) {
    for (let j = HEIGHT - 1; j > 2; j--) {
      sections.push([
        board[j][i],
        board[j - 1][i + 1],
        board[j - 2][i + 2],
        board[j - 3][i + 3]
      ])
    }
  }
  return sections;
}

function sectionScore(section: Section, player: Connect4Turn) {
  // Assigns a score to a section based on how likely player is to win/lose
  let score = 0;
  let selfCount = 0
  let opponentCount = 0
  let empty = 0

  for (let i = 0; i < 4; i++) {
    if (section[i] === player) selfCount++;
    else if (section[i] == opposite(player)) opponentCount++;
    else empty++;
  }

  if (selfCount == 4) score += 100;
  if (selfCount == 3 && empty == 1) score += 5;
  if (selfCount == 2 && empty == 2) score += 2;
  if (opponentCount == 3 && empty == 1) score -= 4;

  return score;
}

const scorer = (me: Connect4Turn) => (state: Connect4State, cache?: Cache): number => {
  let score = 0;
  if (isPlayerWin(state, me)) {
    return 9999999999999;
  }
  if (isPlayerWin(state, opposite(me))) {
    return -99999999999999999
  }
  const sections = cache?.sections ?? getSections(state.board);

  for (let i = 0; i < sections.length; i++)
    score += sectionScore(sections[i], me);

  for (let i = 0; i < 6; i++)
    if (state.board[i][3] == me) score += 3;

  return score;
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
    return moves[getRandomMove(moves.length)]
  }
  return {
    type: Connect4ActionType.END_GAME
  }
}

export const abAgent: Connect4Agent = (state): Connect4Action => {
  const newLocal = alphaBetaTree({
    state,
    generator,
    isEndGame,
    scorer: scorer(state.turn),
    depth: 5,
    maximize: true,
    alpha: -Infinity,
    beta: Infinity,
    apply: applyAction,
    computCache(state) {
      return {
        sections: getSections(state.board)
      }
    },
  })
  return newLocal.action ?? baseAgent(state)
}

export default abAgent
