import { makeQueue } from "../common/queues";
import { makeStore } from "../common/store";
import { makeRouter } from '../common/router'
import { TURN_ADD_MS } from './config'
import { processMove } from './processMove'
import { processConclude } from './processConclude'
import { processEvaluate } from './processEvaluate'
import { ChallengeContext } from '../common/types'
import {
  TicTacToeAction,
  TicTacToeBattle,
  TicTacToeCaseType,
  TicTacToeMove,
  TicTacToeResult,
  TicTacToeState,
  TicTacToeTurn
} from './types'

type TTTChallengeContext = ChallengeContext<
  TicTacToeAction,
  TicTacToeBattle,
  TicTacToeCaseType,
  TicTacToeMove,
  TicTacToeResult,
  TicTacToeState,
  TicTacToeTurn>
const context: TTTChallengeContext = {
  prefix: 'ttt',
  TURN_ADD_MS,
  processMove,
  processConclude,
  processEvaluate
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const tttApp = makeRouter(makeQueue(makeStore(context)))
