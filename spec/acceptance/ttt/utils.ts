import { TicTacToeActionType } from "../../../src/ttt/types"
import { play, receiveEvent, Step } from "../common"

export const expectPutSymbol = (position: string, player: string) =>
	receiveEvent((event) => {
		expect(event).toEqual({ action: TicTacToeActionType.PUT_SYMBOL, position, player })
	})

export const putSymbol = (
	position: string
): Step => {
	return play({ action: TicTacToeActionType.PUT_SYMBOL, position })
}