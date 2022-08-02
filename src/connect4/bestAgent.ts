import axios from "axios";
import { isColumnFull } from "./common";
import { Connect4Action, Connect4ActionType, Connect4State } from "./types";

const bestAgent = async (state: Connect4State): Promise<Connect4Action> => {
  const { data } = await axios.get(`https://connect4.gamesolver.org/solve?pos=${state.moves}`)
  const score: number[] = data?.score ?? [0, 0, 0, 0, 0, 0, 0]
  const highestScore = Math.max(...score.filter((_, k) => !isColumnFull(state, k)));
  const column = score.findIndex(a => a === highestScore);
  return {
    type: Connect4ActionType.PUT_TOKEN,
    column
  }
}

export default bestAgent
