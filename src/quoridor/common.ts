import produce from 'immer'
import PriorityQueue from 'priorityqueuejs'
import { Action, ActionType, Coord, Node, Orientation, Player, Result, State, Turn } from './types'

export const SIZE = 9
export const INITIAL_WALLS = 10

export const initPlayer = (y: number): Player => ({
  walls: INITIAL_WALLS,
  x: 4,
  y
})

export const make2dArray = <T> (size: number, value: T): T[][] => {
  return Array(size)
    .fill('')
    .map(() => Array(size).fill(value) as T[])
}

export const initState = (): State => ({
  walls: make2dArray(SIZE * 2 + 1, false),
  players: {
    [Turn.WHITE]: initPlayer(0),
    [Turn.BLACK]: initPlayer(SIZE - 1)
  },
  turn: Turn.BLACK,
  expectFlip: false
})

export const putWall = (x: number, y: number, o: Orientation) => (state: State): State =>
  produce(state, draft => {
    if (o === Orientation.HORIZONTAL) {
      draft.walls[2 * y + 1][2 * x]
        = draft.walls[2 * y + 1][2 * x + 1]
        = draft.walls[2 * y + 1][2 * x + 2]
        = true
    } else {
      draft.walls[2 * y][2 * x + 1]
        = draft.walls[2 * y + 1][2 * x + 1]
        = draft.walls[2 * y + 2][2 * x + 1]
        = true
    }
    draft.players[draft.turn].walls--
    draft.turn = opposite(draft.turn)
    return draft
  })

export const movePawn = (x: number, y: number) => (state: State) =>
  produce(state, draft => {
    draft.players[draft.turn].x = x
    draft.players[draft.turn].y = y
    draft.turn = opposite(draft.turn)
    return draft
  })

export const applyAction = (state: State, action: Action): State => {
  if (action.o !== undefined) {
    return putWall(action.x, action.y, action.o)(state)
  } else {
    return movePawn(action.x, action.y)(state)
  }
}

export const isEndGame = (state: State) => {
  const { y } = state.players[state.turn]
  const enemy = state.players[opposite(state.turn)]
  const targetYp = state.turn === Turn.BLACK ? 0 : SIZE - 1
  const targetYq = SIZE - 1 - targetYp
  return y === targetYp || enemy.y === targetYq
}

export const canPutWall = (state: State, x: number, y: number, o: Orientation): boolean => {
  return isWallNotOverlap(state, x, y, o) && isWallHavePath(state, x, y, o)
}

export const isWallNotOverlap = (state: State, x: number, y: number, o: Orientation): boolean => {
  //within placeable range
  if (x < 0 || y < 0) {
    return false
  }

  if (o === Orientation.HORIZONTAL) {
    if (x > SIZE - 2) {
      return false
    }
    if (y > SIZE - 1) {
      return false
    }
  } else {
    if (x > SIZE - 1) {
      return false
    }
    if (y > SIZE - 2) {
      return false
    }
  }

  // places not occupied
  if (o === Orientation.HORIZONTAL) {
    if (state.walls[2 * y + 1][2 * x]
      || state.walls[2 * y + 1][2 * x + 1]
      || state.walls[2 * y + 1][2 * x + 2]) {
      return false
    }
  } else {
    if (state.walls[2 * y][2 * x + 1]
      || state.walls[2 * y + 1][2 * x + 1]
      || state.walls[2 * y + 2][2 * x + 1]) {
      return false
    }
  }
  return true
}

export const isWallHavePath = (state: State, x: number, y: number, o: Orientation): boolean => {
  const nextState = putWall(x, y, o)(state)
  return pathLength(nextState, Turn.WHITE) >= 0 && pathLength(nextState, Turn.WHITE) >= 0
}

export const pathLength = (state: State, turn: Turn): number => {
  const { x: sourceX, y: sourceY } = state.players[turn]
  const targetY = turn === Turn.BLACK ? 0 : SIZE - 1
  const queue = new PriorityQueue<Node>((a, b) => {
    return (b.sourceDistance + b.targetDistance) - (a.sourceDistance + a.targetDistance)
  })
  queue.enq({
    x: sourceX,
    y: sourceY,
    sourceDistance: 0,
    targetDistance: Math.abs(sourceY - targetY)
  })
  const visited = make2dArray(SIZE, false)
  visited[sourceX][sourceY] = true
  while (!queue.isEmpty()) {
    const node: Node = queue.deq()
    const neighbors = getWalkableNeighborCoords(state, turn, node)
    for (const n of neighbors) {
      if (visited[n.y][n.x]) continue
      const targetDistance = Math.abs(n.y - targetY)
      if (targetDistance === 0) {
        return node.sourceDistance + 1
      }
      queue.enq({
        x: n.x,
        y: n.y,
        sourceDistance: node.sourceDistance + 1,
        targetDistance: targetDistance
      })
      visited[n.y][n.x] = true
    }
  }
  return -1
}

export const dx = [0, 1, 0, -1]
export const dy = [-1, 0, 1, 0]

export const opposite = (turn: Turn) => turn === Turn.BLACK ? Turn.WHITE : Turn.BLACK

export const getWalkableNeighborCoords = (state: State, turn: Turn, source?: Coord): Coord[] => {
  const { x, y } = source ?? state.players[turn]
  const nodes: Array<Coord> = []
  const opponent = state.players[opposite(turn)]
  for (let i = 0; i < 4; i++) {
    const x1 = x + dx[i]
    const y1 = y + dy[i]
    pushIfWalkable(nodes, state, x, y, x1, y1)
    if (opponent.x === x1 && opponent.y === y1) {
      if (!pushIfWalkable(nodes, state, x1, y1, x1 + dx[i], y1 + dy[i])) {
        const i1 = (i + 1) % 4
        const i3 = (i + 3) % 4
        pushIfWalkable(nodes, state, x1, y1, x1 + dx[i1], y1 + dy[i1])
        pushIfWalkable(nodes, state, x1, y1, x1 + dx[i3], y1 + dy[i3])
      }
    }
  }
  return nodes
}

export const isWalkable = (state: State, x0: number, y0: number, x1: number, y1: number) => {
  if (x1 < 0 || y1 < 0 || x1 >= SIZE || y1 >= SIZE) {
    return false
  }
  if (state.players.black.x === x1 && state.players.black.y === y1) {
    return false
  }
  if (state.players.white.x === x1 && state.players.white.y === y1) {
    return false
  }
  return !state.walls[y0 + y1][x0 + x1]
}

export const pushIfWalkable = (
  mutableArray: Coord[], state: State, x0: number, y0: number, x1: number, y1: number
) => {
  if (isWalkable(state, x0, y0, x1, y1)) {
    mutableArray.push({ x: x1, y: y1 })
    return true
  }
  return false
}

export const allPossibleWalls = (state: State): Action[] => {
  const a = []
  for(let y = 0; y < SIZE - 1; y++) {
    for(let x= 0; x < SIZE - 1; x++) {
      if (canPutWall(state, x, y, Orientation.HORIZONTAL)) {
        a.push({x,y,o:Orientation.HORIZONTAL,type: ActionType.PUT_WALL})
      }
      if (canPutWall(state, x, y, Orientation.VERTICAL)) {
        a.push({x,y,o:Orientation.VERTICAL,type: ActionType.PUT_WALL})
      }
    }
  }
  return a
}

export const getResult = (state: State): Result | undefined => {
  if (state.players[Turn.BLACK].y === 0) {
    return Result.BLACK_WIN
  }
  if (state.players[Turn.WHITE].y === SIZE - 1) {
    return Result.WHITE_WIN
  }
  return undefined
}
