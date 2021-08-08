# Arena technical and judging details (?)

Need to be two different questions since they are graded seperately

## Tic Tac Toe (100%)

tic-tac-toe cheater (20%): player scores if they flip table right after this

5% for ai being X but went first `C_AI_X_FIRST`

5% for ai putting his symbol to non-empty box `C_AI_DUP`

5% for ai trying to expand the grid (aka x=3) `C_AI_OUT_OF_BOUND`

5% for ai move twice a row `C_AI_TWICE_A_ROW`

tic-tac-toe baseline (40%): sequentially fill up all boxes

20% for player being O win us `BASE_AI_O`

20% for player being X win us `BASE_AI_X`

tic-tac-toe advance (40%): alpha beta pruning tree

20% for player being O at least draw `AB_AI_O`

20% for player being X at least draw `AB_AI_X`

## Quoridor (100%)

quoridor cheater (20%): (player scores if they flip table right after this)

2% for teleporting pawn `C_AI_TELEPORT`

2% for ai being second but went first `C_AI_SECOND_FIRST`

2% for ai move twice a row `C_AI_TWICE_A_ROW`

2% for putting a wall outside the grid `C_AI_WALL_OUTSIDE`

2% for moving out of grid `C_AI_PAWN_OUTSIDE`

4% crossing over wall `C_AI_WALL_CROSS`

6% wall that will block the way to goal `C_AI_WALL_BLOCKING`

quoridor baseline (30%): choose random move from all possible movements

15% for winning baseline with first `BASE_AI_FIRST`

15% for winning baseline with second `BASE_AI_SECOND`

quoridor advanced (40% + 10%): alpha beta tree `AB_AI_FIRST`, `AB_AI_SECOND`

for first and second each case has 20 + 5 marks

| surviving # turns | score  |
| ----------------- | ------ |
| 5                 | 1      |
| 10                | 3      |
| 15                | 6      |
| 20                | 10     |
| 20+               | 1/turn |
| 30+               | 20     |
score 25 immediately after winning that battle

--------------------------------------

I am expecting the participants will find some library or make/ clone an ui to play these boardgames as they are standard rules.
The game timer start only after they call the /tic-tac-toe/start or /quoridor/start,
so they dont need to play all these test cases simultaneously,
thus building an ui to play is possible,
just that the time limit is just few seconds only so they need to think fast and carefully not to break rules.
So the real challenge is actually wiring all the things up but not AI haha
