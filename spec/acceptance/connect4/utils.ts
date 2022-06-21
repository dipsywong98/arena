import { Column, Connect4Turn } from "../../../src/connect4/types"
import { Connect4ActionType } from "../../../src/connect4/types"
import { play, receiveEvent, Step } from "../common"

export const expectPutToken = (player: Connect4Turn, column: Column = expect.any(String)) =>
	receiveEvent((event) => {
		expect(event).toEqual({ action: Connect4ActionType.PUT_TOKEN, column, player })
	})

export const putToken = (
	column: Column
): Step => {
	return play({ action: Connect4ActionType.PUT_TOKEN, column })
}