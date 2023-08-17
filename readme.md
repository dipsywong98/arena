# Arena

> Author: Dipsy ([dipsywong98](https://github.com/dipsywong98))

## Story

Inspired by a real-life story... Social distancing keeps you away from your friends so you can't play board games with them physically anymore. But in actuality, your friends don't want to play board games with you regardless as they'd rather play Ring Fit with themselves. Don't be sad, you can still play board games with Arena.


## Challenge description

The Arena challenge consists of three levels

- level 0 [Tic-Tac-Toe](https://en.wikipedia.org/wiki/Tic-tac-toe) (challenge in 2021,2022 Arena)
- level 1 [Connect4](https://en.wikipedia.org/wiki/Connect_Four) (challenge in 2022 Arena)
- level 2 [Quoridor](https://en.wikipedia.org/wiki/Quoridor)  (challenge in 2021 Arena)


The Tic-Tac-Toe level is more about familiarizing with the networking protocol. Connect4 and Quoridor are really where the real challenge happens.


## Tic-Tac-Toe

### Goal

Win the baseline AI, at least draw with the advanced AI, and flip the table when necessary within the time limit. For each Tic-Tac-Toe game, you will start with 18s in your timer to think. Every time you respond you will gain an additional 2s to think.

### Rules

The good old Tic-Tac-Toe rules. There are two players, `O` and `X`. `O` goes first, and they each take turns placing one of their symbols in an empty
box in the 3x3 grid. The first to get three in a row/column/diagonal wins. Otherwise, when the grid is full, it's a draw.

### Notation

Use this compass notation when requesting and handling responses with the Arena Tic-Tac-Toe agent.

```
|NW|N |NE|
+--+--+--+
|W |C |E |
+--+--+--+
|SW|S |SE|
```

### How to play

1. Tic Tac Toe is NOT a part of this year's challenge, you cannot request grading from the coordinator. Instead, `POST` to `https://cis2022-arena.herokuapp.com/tic-tac-toe/tryout` with the following payload to ask arena to play Tic Tac Toe with you. 
```json
{
  "teamUrl": "http://your-team-url.herokuapp.com"
}
```
In response, `resultUrl` is the url that you can `GET` your score, `errors` contains the errors when posting to your url in the next step.
```json
{
    "resultUrl": "https://cis2022-arena.herokuapp.com/tic-tac-toe/result/9888d9de-1809-4a78-b567-74c2362b987c",
    "errors": {}
}
```
2. The Arena will `POST` to your `/tic-tac-toe` endpoint with `battleId` in
   the body.

   ```json
   {
     "battleId": "21083c13-f0c2-4b54-8cb1-090129ffaa93"
   }
   ```

3. Your system initiates a `GET` request at `https://cis2022-arena.herokuapp.com/tic-tac-toe/start/{battleId}`, which is
   an [`event/stream`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
   of which the Arena server can keep pushing the latest updates (as events) of the battle to you. The possible events are defined in the next section. [See a live example SSE page here](/sse-sample)

4. When it is your turn, you will need to submit your move within your thinking time. To submit a move, `POST`
   to `https://cis2022-arena.herokuapp.com/tic-tac-toe/play/{battleId}` with the payload

   ```json
   {
     "action": "putSymbol",
     "position": "SE"
   }
   ```

   where the position is written in compass notation.

5. Invalid moves are considered surrendering and the opponent should flip the table. To flip the table, `POST`
   to `https://cis2022-arena.herokuapp.com/tic-tac-toe/play/{battleId}` with the payload

   ```json
   {
     "action": "(╯°□°)╯︵ ┻━┻"
   }
   ```

### Events

The initial event tells you what symbol you are.

```
data: {"youAre":"O","id":"15f6301f-cbdd-4084-a810-df2e9c83238f"}
```

The move event tells you who has made what move.

```
data: {"player":"O","action":"putSymbol","position":"NW"}
```

The game end event tells you the game result.

```
data: {"winner":"draw"}
data: {"winner":"O"}
```

The flip table event tells who has flipped the table.

```
data: {"player":"O","action":"(╯°□°)╯︵ ┻━┻"}
```

## Connect 4

### Goal

Win the baseline AI and advanced AI (which is not perfect so it is possible to win it!), and flip the table when necessary within the time limit. For each Connect 4 game, you will start with 18s in your timer to think. Every time you respond you will gain an additional 2s to think.

### Rules

The good old Connect 4 rules. There are two players, `🔴` and `🟡`. `🔴` goes first, and they each take turns placing one of their tokens in one of the columns. The first to get four in a row/column/diagonal wins. Otherwise, when the grid is full, it's a draw.

### Notation

There are 7 columns in the connnect 4 game, namely A, B, C, D, E, F, G. Each column can at max put 6 tokens

### How to play

1. Request for a Connect4 evaluation at the coordinator `https://cis2022-{sg or hk}-{individual or team}.herokuapp.com/`. (Connect4 dont have tryout endpoint, please use the coordinator for evaluation and result look up)
2. The coordinator will ask Arena to play connect 4 with you. The Arena will `POST` to your `/connect4` endpoint with `battleId` in
   the body.

   ```json
   {
     "battleId": "21083c13-f0c2-4b54-8cb1-090129ffaa93"
   }
   ```

3. Your system initiates a `GET` request at `https://cis2022-arena.herokuapp.com/connect4/start/{battleId}`, which is
   an [`event/stream`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
   of which the Arena server can keep pushing the latest updates (as events) of the battle to you. The possible events are defined in the next section. [See a live example SSE page here](/sse-sample)

4. When it is your turn, you will need to submit your move within your thinking time. To submit a move, `POST`
   to `https://cis2022-arena.herokuapp.com/connect4/play/{battleId}` with the payload

   ```json
   {
     "action": "putToken",
     "column": "A"
   }
   ```

5. Invalid moves are considered surrendering and the opponent should flip the table. To flip the table, `POST`
   to `https://cis2022-arena.herokuapp.com/connect4/play/{battleId}` with the payload. (Imagine arena is a real player that she may make any kinds of mistakes to you!)

   ```json
   {
     "action": "(╯°□°)╯︵ ┻━┻"
   }
   ```

### Events

The initial event tells you what symbol you are.

```
data: {"youAre":"🔴","id":"15f6301f-cbdd-4084-a810-df2e9c83238f"}
```

The move event tells you who has made what move.

```
data: {"player":"🔴","action":"putToken","column":"A"}
```

The game end event tells you the game result.

```
data: {"winner":"draw"}
data: {"winner":"🔴"}
```

The flip table event tells who has flipped the table.

```
data: {"player":"🔴","action":"(╯°□°)╯︵ ┻━┻"}
```

## Quoridor

### Goal

Win the baseline AI, survive long enough when battling with the advanced AI, and flip the table when necessary within the time limit.
For each Quoridor game, you will start with 60s in your timer to think. Every time you respond you will gain an additional 2s to think.

### Rules

(Copy-pasted from wiki)

Quoridor is played on a game board of 81 square spaces (9x9). Each player is represented by a pawn which begins at the center space of one edge of the board (in a two-player game, the pawns begin opposite each other). The objective is to be the first player to move their pawn to any space on the opposite side of the game board from which it begins.

The distinguishing characteristic of Quoridor is its twenty walls. Walls are flat two-space-wide pieces that can be placed in the groove that runs between the spaces. Walls block the path of all pawns, which must go around them. The walls are divided equally among the players at the start of the game, and once placed, cannot be moved or removed. On a turn, a player may either move their pawn or, if possible, place a wall.

Legal pawn moves according to the location of the opponent and the walls.
Pawns can be moved to any space at a right angle (but not diagonally). If adjacent to another pawn, the pawn may jump over that pawn. If an adjacent pawn has a third pawn or a wall on the other side of it, the player may move to either space that is immediately adjacent (left or right) to the first pawn. Multiple pawns may not be jumped. Walls may not be jumped, including when moving laterally due to a pawn or wall being behind a jumped pawn.

Walls can be placed directly between two spaces, in any groove not already occupied by a wall. However, a wall may not be placed which cuts off the only remaining path of any pawn to the side of the board it must reach.

### Notation

We use the [standard Quoridor notation](https://quoridorstrats.wordpress.com/notation/) for the Arena Quoridor game.

![](static/quoridor-view.png)
![](static/quoridor.png)

### Few things to note

- You may be the `first` or `second` player.
- The first player starts at `e1` and the second at `e9`.
- The first player wins if they reach row `9` and the second wins if they reach row `1`.
- Each player has 10 walls.

### How to play

1. Request for a Quoridor evaluation at the coordinator.
2. The coordinator will ask Arena to play Quoridor with you. The Arena will `POST` to your `/quoridor` endpoint with `battleId` in
   the body.

   ```json
   {
     "battleId": "21083c13-f0c2-4b54-8cb1-090129ffaa93"
   }
   ```

3. Your system initiates a `GET` request at `https://cis2021-arena.herokuapp.com/quoridor/start/{battleId}`, which is
   an [`event/stream`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
   of which the Arena server can keep pushing the latest updates (as events) of the battle to you. The possible events are defined in the next section.

4. When it is your turn, you will need to submit your move within the time limit. To submit a move, `POST`
   to `https://cis2021-arena.herokuapp.com/quoridor/play/{battleId}`.

   To move your pawn:

   ```json
   {
     "action": "move",
     "position": "e8"
   }
   ```

   where the `position` is written in chess notation.

   To place a wall:

   ```json
   {
     "action": "putWall",
     "position": "a8h"
   }
   ```

   where the `position` is written in the 3-character standard Quoridor notation.

5. Invalid moves are considered surrendering, and the opponent should flip the table. To flip the table, `POST`
   to `https://cis2021-arena.herokuapp.com/quoridor/play/{battleId}` with the payload

   ```json
   {
     "action": "(╯°□°)╯︵ ┻━┻"
   }
   ```

### Events

The initial event tells your which player you are.

```
data: {"youAre":"second","id":"15f6301f-cbdd-4084-a810-df2e9c83238f"}
```

```
data: {"youAre":"first","id":"15f6301f-cbdd-4084-a810-df2e9c83238f"}
```

The move event tells you who has made what move.

```
data: {"player":"second","position":"e8","action": "move"}
```

```
data: {"player":"first","position":"e6v","action": "putWall"}
```

The game end event tells you the game result.

```
data: {"winner":"first"}
data: {"winner":"second"}
```

The flip table event tells who has flipped the table.

```
data: {"player":"first","action":"(╯°□°)╯︵ ┻━┻"}
```
