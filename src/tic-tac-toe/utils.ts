export type Turn = 'X' | 'O'

export const flip = (turn: Turn) => turn === 'X' ? 'O' : 'X'
