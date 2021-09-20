import produce from 'immer'
import PriorityQueue from 'priorityqueuejs'
import {
  Coord,
  ExternalAction,
  Node,
  Orientation,
  Player,
  QActionInternal,
  QuoridorAction,
  QuoridorActionType,
  QuoridorResult,
  QuoridorState,
  QuoridorStateCompressed,
  QuoridorTurn
} from './types'

export const SIZE = 9
export const INITIAL_WALLS = 10

export const initPlayer = (y: number): Player => ({
  walls: INITIAL_WALLS,
  x: 4,
  y
})

export const make2dArray = <T>(size: number, value: T): T[][] => {
  return Array(size)
    .fill('')
    .map(() => Array(size).fill(value) as T[])
}

export const initState = (): QuoridorState => ({
  walls: make2dArray(SIZE * 2 + 1, false),
  players: {
    [QuoridorTurn.SECOND]: initPlayer(0),
    [QuoridorTurn.FIRST]: initPlayer(SIZE - 1)
  },
  turn: QuoridorTurn.FIRST,
  expectFlip: false,
  createdAt: Date.now()
})

export const putWall = (x: number, y: number, o: Orientation) => (
  (state: QuoridorState): QuoridorState =>
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
      draft.createdAt = Date.now()
      return draft
    })
)
export const movePawn = (x: number, y: number) => (state: QuoridorState) =>
  produce(state, draft => {
    draft.players[draft.turn].x = x
    draft.players[draft.turn].y = y
    draft.turn = opposite(draft.turn)
      draft.createdAt = Date.now()
    return draft
  })

export const applyAction = (state: QuoridorState, action: QActionInternal): QuoridorState => {
  if (action.o !== undefined) {
    return putWall(action.x, action.y, action.o)(state)
  } else {
    return movePawn(action.x, action.y)(state)
  }
}

export const isEndGame = (state: QuoridorState) => {
  const { y } = state.players[state.turn]
  const enemy = state.players[opposite(state.turn)]
  const targetYp = state.turn === QuoridorTurn.FIRST ? 0 : SIZE - 1
  const targetYq = SIZE - 1 - targetYp
  return y === targetYp || enemy.y === targetYq
}

export const canPutWall = (state: QuoridorState, x: number, y: number, o: Orientation): boolean => {
  return isWallNotOverlap(state, x, y, o) && isWallHavePath(state, x, y, o)
}

export const isWallNotOverlap = (
  state: QuoridorState,
  x: number,
  y: number,
  o: Orientation): boolean => {
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

export const isWallHavePath = (
  state: QuoridorState,
  x: number,
  y: number,
  o: Orientation
): boolean => {
  const nextState = putWall(x, y, o)(state)
  const secondHavePath = pathLength(nextState, QuoridorTurn.SECOND) >= 0
  const firstHavePath = pathLength(nextState, QuoridorTurn.FIRST) >= 0
  return secondHavePath && firstHavePath
}

export const pathLength = (state: QuoridorState, turn: QuoridorTurn): number => {
  const { x: sourceX, y: sourceY } = state.players[turn]
  const targetY = turn === QuoridorTurn.FIRST ? 0 : SIZE - 1
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

export const opposite = (turn: QuoridorTurn) => (
  turn === QuoridorTurn.FIRST ? QuoridorTurn.SECOND : QuoridorTurn.FIRST
)

export const getWalkableNeighborCoords = (
  state: QuoridorState,
  turn: QuoridorTurn,
  source?: Coord): Coord[] => {
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

export const isWalkable = (
  state: QuoridorState,
  x0: number,
  y0: number,
  x1: number,
  y1: number) => {
  if (x1 < 0 || y1 < 0 || x1 >= SIZE || y1 >= SIZE) {
    return false
  }
  if (state.players.first.x === x1 && state.players.first.y === y1) {
    return false
  }
  if (state.players.second.x === x1 && state.players.second.y === y1) {
    return false
  }
  try {
    return !state.walls[y0 + y1][x0 + x1]
  } catch (e) {
    return false
  }
}

export const pushIfWalkable = (
  mutableArray: Coord[], state: QuoridorState, x0: number, y0: number, x1: number, y1: number
) => {
  if (isWalkable(state, x0, y0, x1, y1)) {
    mutableArray.push({ x: x1, y: y1 })
    return true
  }
  return false
}

export const allPossibleWalls = (state: QuoridorState, checker = canPutWall): QActionInternal[] => {
  const a = []
  for (let y = 0; y < SIZE - 1; y++) {
    for (let x = 0; x < SIZE - 1; x++) {
      if (checker(state, x, y, Orientation.HORIZONTAL)) {
        a.push({ x, y, o: Orientation.HORIZONTAL, type: QuoridorActionType.PUT_WALL })
      }
      if (checker(state, x, y, Orientation.VERTICAL)) {
        a.push({ x, y, o: Orientation.VERTICAL, type: QuoridorActionType.PUT_WALL })
      }
    }
  }
  return a
}

export const getResult = (state: QuoridorState): QuoridorResult | undefined => {
  if (state.players[QuoridorTurn.FIRST].y === 0) {
    return QuoridorResult.FIRST_WIN
  }
  if (state.players[QuoridorTurn.SECOND].y === SIZE - 1) {
    return QuoridorResult.SECOND_WIN
  }
  return undefined
}

export const internalizeAction = (action: ExternalAction): QuoridorAction => {
  if (action.action === QuoridorActionType.MOVE) {
    if (action.position !== undefined) {
      const [a, b] = action.position.split('')
      const x = 'abcdefghi'.indexOf(a.toLowerCase())
      const y = 9 - Number.parseInt(b)
      if (x >= 0 && y === y) {
        return {
          type: action.action,
          x,
          y
        }
      }
    }
    throw new Error(`${action.position ?? 'undefined'} is not a valid position`)

  } else if (action.action === QuoridorActionType.PUT_WALL) {
    if (action.position !== undefined) {
      const [a, b, c] = action.position.split('')
      const x = 'abcdefghi'.indexOf(a.toLowerCase())
      const y = 8 - Number.parseInt(b)
      const o = {
        v: Orientation.VERTICAL,
        h: Orientation.HORIZONTAL
      }[c]
      if (x >= 0 && y === y && o !== undefined) {
        return {
          type: action.action,
          x,
          y,
          o
        }
      }
    }
    throw new Error(`${action.position ?? 'undefined'} is not a valid position`)
  } else {
    return {
      type: action.action
    }
  }
}

export const externalizeAction = (
  action: QuoridorAction,
  player?: string,
  rest?: Record<string, unknown>): ExternalAction => {
  if (action.type === QuoridorActionType.MOVE) {
    const { x, y } = action
    if (x !== undefined && y !== undefined) {
      const a = 'abcdefghi'[x]
      const b = 9 - y
      return {
        action: action.type,
        position: `${a}${b}`,
        player,
        ...rest
      }
    }
    return {
      action: action.type,
      position: '',
      player,
      ...rest
    }
  } else if (action.type === QuoridorActionType.PUT_WALL) {
    const { x, y, o } = action
    if (x !== undefined && y !== undefined && o !== undefined) {
      const a = 'abcdefghi'[x]
      const b = 8 - y
      const c = {
        [Orientation.VERTICAL]: 'v',
        [Orientation.HORIZONTAL]: 'h'
      }[o]
      return {
        action: action.type,
        position: `${a}${b}${c}`,
        player,
        ...rest
      }
    }
    return {
      action: action.type,
      position: '',
      player,
      ...rest
    }
  } else {
    return {
      action: action.type,
      player,
      ...rest
    }
  }
}

export const blocked = (state: QuoridorState) => {
  return (
    pathLength(state, QuoridorTurn.FIRST) < 0
    || pathLength(state, QuoridorTurn.SECOND) < 0
  )
}

export const compressState = (state: QuoridorState): QuoridorStateCompressed => {
  const { walls, ...rest } = state
  // Pako.deflate(, { to: 'string' })
  return { walls: walls.map(r => (r.map(f => f ? '1' : '0').join(''))).join('\n'), ...rest }
}

export const depressState = (
  state: QuoridorStateCompressed | undefined
): QuoridorState | undefined => {
  if (state === undefined) return undefined
  const { walls, ...rest } = state
  return {
    walls: walls.split('\n').map(r => r.split('').map(f => f === '1' ? true : false)),
    ...rest
  }
}
