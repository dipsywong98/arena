# Arena

> Author: Dipsy ([dipsywong98](https://github.com/dipsywong98))

## Story

Inspired by a real-life story... Social distancing keeps you away from your friends so you can't play board games with them physically anymore. But in actuality, your friends don't want to play board games with you regardless as they'd rather play Ring Fit with themselves. Don't be sad, you can still play board games with Arena.

## Challenge description

The Arena is actually playing the famous [connect4 game](https://en.wikipedia.org/wiki/Connect_Four)

### Goal

Win the baseline AI, at least draw with the advanced AI, and flip the table when necessary within the time limit. For each Connect 4 game, you will start with 18s in your timer to think. Every time you respond you will gain an additional 2s to think.

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
   of which the Arena server can keep pushing the latest updates (as events) of the battle to you. The possible events are defined in the next section.

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
