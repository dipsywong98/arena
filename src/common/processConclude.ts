import { ConcludePayload, Game } from "./types";
import { processConclude as ttt } from '../ttt/processConclude'
import { processConclude as quoridor } from '../quoridor/processConclude'
import { processConclude as c4 } from '../connect4/processConclude'

export const processConclude = async ({ game, conclude }: ConcludePayload) => {
  switch (game) {
    case Game.TTT: return ttt(conclude)
    case Game.QUORIDOR: return quoridor(conclude)
    case Game.CONNECT4: return c4(conclude)
    default: throw new Error('unknown game')
  }
}
