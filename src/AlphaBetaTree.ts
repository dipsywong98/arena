interface AlphaBetaTreeConfig<State, Action> {
  state: State
  isEndGame: (state: State) => boolean
  scorer: (state: State) => number
  generator: (state: State) => Action[]
  apply: (state: State, action: Action) => State
  depth: number
  maximize: boolean
  alpha: number
  beta: number
}

interface AlphaBetaTreeResult<State, Action> {
  state: State
  action?: Action
  score: number
}

export const alphaBetaTree = <State, Action> (
  {
    state,
    isEndGame,
    scorer,
    generator,
    depth,
    maximize = true,
    alpha = -Infinity,
    beta = Infinity,
    apply
  }: AlphaBetaTreeConfig<State, Action>
): AlphaBetaTreeResult<State, Action> => {
  if (depth === 0 || isEndGame(state)) {
    return { score: scorer(state), state }
  }
  const children = generator(state)
  if (maximize) {
    let bestResult: AlphaBetaTreeResult<State, Action> = {
      state,
      score: -Infinity
    }
    for (const child of children) {
      const result = alphaBetaTree({
        state: apply(state, child),
        isEndGame,
        scorer,
        generator,
        depth: depth - 1,
        maximize: !maximize,
        alpha,
        beta,
        apply
      })
      if (result.score > bestResult.score) {
        bestResult = result
        bestResult.action = child
      }
      if (bestResult.score >= beta) {
        break
      }
      alpha = bestResult.score
    }
    return bestResult
  } else {
    let bestResult: AlphaBetaTreeResult<State, Action> = {
      state,
      score: Infinity
    }
    for (const child of children) {
      const result = alphaBetaTree({
        state: apply(state, child),
        isEndGame,
        scorer,
        generator,
        depth: depth - 1,
        maximize: !maximize,
        alpha,
        beta,
        apply
      })
      if (result.score < bestResult.score) {
        bestResult = result
        bestResult.action = child
      }
      if (bestResult.score <= alpha) {
        break
      }
      beta = bestResult.score
    }
    return bestResult
  }
}
