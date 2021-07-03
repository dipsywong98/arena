# Arena

> Author: Dipsy ([dipsywong98](https://github.com/dipsywong98))

## Story

Social distancing keeps you away from your friends so you cant play boardgame, and then at home your friends just play
other games but not boardgames. Dont be sad there is still Arena can play boardgame with you.

## Challenge description

The Arena consists of two levels, level 1 [tic-tac-toe](https://en.wikipedia.org/wiki/Tic-tac-toe) and level
2 [quoridor](https://en.wikipedia.org/wiki/Quoridor). The tic-tac-toe is more of trying around the network protocol, and
the quoridor is where the real battle happens.

## Tic Tac Toe

### Goal

win the baseline AI and at least draw with the advanced AI to win 20% of the score

### Rule

The good old tic-tac-toe rule, two players `O` and `X`, `O` go first, and then take turn to put their symbol to an empty
box in the 3x3 grid, the first to get three in a row/column/diagonal wins, otherwise when the grid is full it's a draw.

### How to play

1. Request for grading tic-tac-toe at the coordinator
2. Coordinator will ask Arena to play tic-tac-toe with you. Arena will `POST` to your `/tic-tac-toe` with `battleId` in
   the body

```json
{
  "battleId": "21083c13-f0c2-4b54-8cb1-090129ffaa93"
}
```

3. Your system `GET` `{arenaEndpoint}/tic-tac-toe/start/{battleId}`, which is
   an [`event/stream`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
   that it can keep pushing latest update (aka events) of the battle to you. The possible events are in the next section

4. When it is your turn, you need to submit your move in 2 seconds. To submit move, `POST`
   to `{arenaEndpoint}/tic-tac-toe/play/{battleId}` with payload

```json
{
  "action": "putSymbol",
  "x": 2,
  "y": 2
}
```

where x and y are `0`, `1`, or `2`

5. Invalid moves are considered as surrendering, and the opponent should flip the table. To flip table, `POST`
   to `{arenaEndpoint}/tic-tac-toe/play/{battleId}` with payload

```json
{
   "action": "flipTable"
}
```

### Events

Initial event tells your symbol
```
data: {"youAre":"O","id":"15f6301f-cbdd-4084-a810-df2e9c83238f"}
```

Move event tells you who made what move
```
data: {"player":"O","x":0,"y":0}
```

Game end event tells you the game end result
```
data: {"winner":"draw"}
data: {"winner":"O"}
```

Flip table tells you someone flip table
```
data: {"flipTable": "O"}
```
