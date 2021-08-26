import { ConcludePayload, Game } from "./types";
import { processConclude as ttt } from '../ttt/processConclude'
import { processConclude as quoridor } from '../quoridor/processConclude'

export const processConclude = async ({ game, conclude }: ConcludePayload) => {
  switch (game) {
    case Game.TTT: return ttt(conclude)
    case Game.QUORIDOR: return quoridor(conclude)
    default: throw new Error('unknown game')
  }
}
