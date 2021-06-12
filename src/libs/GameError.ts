class GameError implements Error {
  message: string
  name: string = 'GameError'

  constructor (message: string) {
    this.message = message
  }
}

export default GameError
