# Arena technical and judging details (?)

## Tic Tac Toe (20 marks)

tic-tac-toe cheater (4 marks): player scores if they flip table right after this

1 scores for ai being X but went first

1 scores for ai putting his symbol to non-empty box

1 scores for ai trying to expand the grid (aka x=3)

1 scores for ai move twice a row

tic-tac-toe baseline (8 marks): sequentially fill up all boxes

4 scores for player being O win us

4 scores for player being X win us

tic-tac-toe advance (8 marks): alpha beta pruning tree

4 scores for player being O at least draw

4 scores for player being X at least draw

## Quoridor (80 marks)

quoridor cheater (10 marks): (player scores if they flip table right after this)

1 for teleporting pawn

1 for ai being first but went first

1 scores for ai move twice a row

1 scores for putting a wall outside the grid

1 scores for moving out of grid

2 for crossing over wall

3 for wall that will block the way to goal

quoridor baseline (20 marks): choose random move from all possible movements

10 scores for winning baseline with first

10 scores for winning baseline with second

quoridor advanced (40 + 10 marks): alpha beta tree

for first and second each case has 20 + 5 marks

|surviving # turns | score |
|------------------|-------|
|5                 |1      |
|10                |3      |
|15                |6      |
|20                |10     |
|20+               |1/turn |

score 25 immediately after winning that battle

--------------------------------------

I am expecting the participants will find some library or make/ clone an ui to play these boardgames as they are standard rules.
The game timer start only after they call the /tic-tac-toe/start or /quoridor/start,
so they dont need to play all these test cases simultaneously,
thus building an ui to play is possible,
just that the time limit is just few seconds only so they need to think fast and carefully not to break rules.
So the real challenge is actually wiring all the things up but not AI haha
