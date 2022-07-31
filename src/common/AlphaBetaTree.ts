interface AlphaBetaTreeConfig<State, Action, Cache> {
  state: State
  isEndGame: (state: State, cache?: Cache) => boolean
  scorer: (state: State, depth: number, cache?: Cache) => number
  generator: (state: State, cache?: Cache) => Action[]
  apply: (state: State, action: Action) => State
  depth: number
  maximize: boolean
  alpha: number
  beta: number
  computCache?: (state: State) => Cache
}

interface AlphaBetaTreeResult<State, Action, Cache> {
  state: State
  action?: Action
  score: number
  cache?: Cache
}

export const alphaBetaTree = <State, Action, Cache = undefined> (
  {
    state,
    isEndGame,
    scorer,
    generator,
    depth,
    maximize = true,
    alpha = -Infinity,
    beta = Infinity,
    apply,
    computCache,
  }: AlphaBetaTreeConfig<State, Action, Cache>
): AlphaBetaTreeResult<State, Action, Cache> => {
  const cache = computCache?.(state)
  if (depth === 0 || isEndGame(state, cache)) {
    return { score: scorer(state, depth, cache), state }
  }
  const children = generator(state, cache)
  if (maximize) {
    let bestResult: AlphaBetaTreeResult<State, Action, Cache> = {
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
        apply,
        computCache,
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
    let bestResult: AlphaBetaTreeResult<State, Action, Cache> = {
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
        apply,
        computCache,
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
