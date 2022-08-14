# Arena

> Author: Dipsy ([dipsywong98](https://github.com/dipsywong98))

## Story

Inspired by a real-life story... Social distancing keeps you away from your friends so you can't play board games with them physically anymore. But in actuality, your friends don't want to play board games with you regardless as they'd rather play Ring Fit with themselves. Don't be sad, you can still play board games with Arena ~~like last year~~.


## Challenge description

The Arena challenge consists of two levels, level 0 [Tic-Tac-Toe](https://en.wikipedia.org/wiki/Tic-tac-toe) and level
1 [Connect4](https://en.wikipedia.org/wiki/Connect_Four).


Tic Tac Toe serves as an example that worth 0 score and Connect 4 is the challenge that you should focus on.


[Ugly code produced in a hurry but still able to solve Tic-Tac-Toe challenge in full score (TypeScript)](/static/sample.zip)


You are free to use or not use the code provided to solve connect4, where the real challenge happens~


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

1. Request for a Tic-Tac-Toe evaluation at the coordinator.
2. The coordinator will ask Arena to play Tic-Tac-Toe with you. The Arena will `POST` to your `/tic-tac-toe` endpoint with `battleId` in
   the body.

   ```json
   {
     "battleId": "21083c13-f0c2-4b54-8cb1-090129ffaa93"
   }
   ```

3. Your system initiates a `GET` request at `https://cis2022-arena.herokuapp.com/tic-tac-toe/start/{battleId}`, which is
   an [`event/stream`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
   of which the Arena server can keep pushing the latest updates (as events) of the battle to you. The possible events are defined in the next section. [See a live SSE page here](/sse-sample)

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

1. Request for a Connect4 evaluation at the coordinator `https://cis2022.herokuapp.com/` (TBA).
2. The coordinator will ask Arena to play connect 4 with you. The Arena will `POST` to your `/connect4` endpoint with `battleId` in
   the body.

   ```json
   {
     "battleId": "21083c13-f0c2-4b54-8cb1-090129ffaa93"
   }
   ```

3. Your system initiates a `GET` request at `https://cis2022-arena.herokuapp.com/connect4/start/{battleId}`, which is
   an [`event/stream`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
   of which the Arena server can keep pushing the latest updates (as events) of the battle to you. The possible events are defined in the next section. [See a live SSE page here](/sse-sample)

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
