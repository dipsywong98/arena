import { QuoridorActionType } from "src/quoridor/types"
import { play, receiveEvent, Step } from "../common"

export const expectPawnMove = (position: string, player: string) =>
receiveEvent((event) => {
  expect(event).toEqual({
    action: QuoridorActionType.MOVE,
    position,
    player
  })
})

export const expectPutWall = (position: string, player: string) =>
receiveEvent((event) => {
  expect(event).toEqual({
    action: QuoridorActionType.PUT_WALL,
    position,
    player
  })
})

export const movePawn = (position: string): Step => play({
  action: QuoridorActionType.MOVE,
  position
})

export const putWall = (position: string): Step => play({
  action: QuoridorActionType.PUT_WALL,
  position
})
