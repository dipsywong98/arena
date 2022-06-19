# Arena technical and judging details (?)

Need to be two different questions since they are graded seperately

## Admin

username: `<blank>`

password: the auth token of coordinator

queue: https://cis2022-arena-dev.herokuapp.com/admin/queues/

quoridor: https://cis2022-arena-dev.herokuapp.com/admin/quoridor/runs/

ttt: https://cis2022-arena-dev.herokuapp.com/admin/ttt/runs/

## Connect 4 (100%)

connect 4 cheater (20%): player scores if they flip table right after this

4% for ai being YELLOW but went first `C_AI_Y_FIRST`

4% for ai putting his symbol to fully filled column `C_AI_OVERFLOW`

4% for ai trying to put outside of  `C_AI_OUT_OF_BOUND`

4% for ai move twice a row `C_AI_TWICE_A_ROW`

4% for ai provide empty to column `C_AI_NIL`

connect 4 baseline (40%): sequentially put to columns that are not full

20% for player being RED win us `BASE_AI_R`

20% for player being YELLOW win us `BASE_AI_Y`

connect 4 advance (40%): alpha beta pruning tree

20% for player being RED at least draw `AB_AI_R`

20% for player being YELLOW at least draw `AB_AI_Y`


I am expecting the participants will find some library or make/ clone an ui to play these boardgames as they are standard rules.
The game timer start only after they call the /tic-tac-toe/start or /quoridor/start (still have some time limit),
so they dont need to play all these test cases simultaneously,
thus building an ui to play is possible,
just that the time limit is just few seconds only so they need to think fast and carefully not to break rules.
So the real challenge is actually wiring all the things up but not AI haha
