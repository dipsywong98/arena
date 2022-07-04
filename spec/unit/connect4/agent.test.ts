import abAgent from '../../../src/connect4/agent'
import {
  COLUMNS,
  Connect4ActionType,
  Connect4Cell,
  Connect4State,
  Connect4Turn
} from '../../../src/connect4/types'

const parseBoard = (str: string): Connect4State['board'] => {
  return str.split('\n').map((row) => {
    const cells = row.replace(/^\s*\|/, '').split('')
    return (
      COLUMNS.map((c, k): Connect4Cell => ({
        [cells[k]]: null,
        R: Connect4Turn.RED,
        Y: Connect4Turn.YELLOW,
      }[cells[k]]))
    )
  })
}

describe('abAgent', () => {
  it('can prevent losing', () => {
    const board = parseBoard(`\
      |       
      |       
      | R     
      | RR    
      |YYR     
      |YYY R`)
    const action = abAgent({
      board: board,
      createdAt: 0,
      expectFlip: false,
      turn: Connect4Turn.RED
    })
    expect(action.column).toEqual(3)
  })

  it('favors winner over losing', () => {
    const board = parseBoard(`\
      |       
      |       
      |       
      |    R  
      |    R   
      |YYY R`)
    const action = abAgent({
      board: board,
      createdAt: 0,
      expectFlip: false,
      turn: Connect4Turn.RED
    })
    expect(action.column).toEqual(4)
  })

  it('can output some location if not possible to prevent losing', () => {
    const board = parseBoard(`\
      |       
      |       
      |       
      |Y      
      |Y   R   
      |YYY R`)
    const action = abAgent({
      board: board,
      createdAt: 0,
      expectFlip: false,
      turn: Connect4Turn.RED
    })
    expect(action.column).toEqual(0)
  })

  it('can output some location already lost', () => {
    const board = parseBoard(`\
      |       
      |       
      |Y      
      |Y      
      |Y   R   
      |YYY R`)
    const action = abAgent({
      board: board,
      createdAt: 0,
      expectFlip: false,
      turn: Connect4Turn.RED
    })
    expect(action.column).not.toEqual(undefined)
  })

  it('can output some location if already win', () => {
    const board = parseBoard(`\
      |       
      |       
      |    R  
      |Y   R   
      |Y   R   
      |YYY R`)
    const action = abAgent({
      board: board,
      createdAt: 0,
      expectFlip: false,
      turn: Connect4Turn.RED
    })
    expect(action.column).not.toEqual(undefined)
  })

  it('can output endgame if board full', () => {
    const board = parseBoard(`\
      |YRYRYRY       
      |RYRYRYR       
      |RYRYRYR
      |YRYRYRY
      |RYRYRYR
      |RYRYRYR`)
    const action = abAgent({
      board: board,
      createdAt: 0,
      expectFlip: false,
      turn: Connect4Turn.RED
    })
    expect(action.type).toEqual(Connect4ActionType.END_GAME)
  })
})
