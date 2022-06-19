import { Game, MovePayload } from "./types";
import { processMove as ttt } from '../ttt/processMove'
import { processMove as quoridor } from '../quoridor/processMove'
import { processMove as c4 } from '../connect4/processMove'

export const processMove = async ({ game, move }: MovePayload) => {
  switch (game) {
    case Game.TTT: return ttt(move)
    case Game.QUORIDOR: return quoridor(move)
    case Game.CONNECT4: return c4(move)
    default: throw new Error('unknown game')
  }
}
