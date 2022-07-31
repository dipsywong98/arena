# Arena technical and judging details (?)

Need to be two different questions since they are graded seperately

## Admin

username: `<blank>`

password: the auth token of coordinator

queue: https://cis2022-arena-dev.herokuapp.com/admin/queues/

quoridor: https://cis2022-arena-dev.herokuapp.com/admin/quoridor/runs/

ttt: https://cis2022-arena-dev.herokuapp.com/admin/ttt/runs/

## Connect 4 (100%)

connect 4 cheater (50%): player scores if they flip table right after this

10% for ai being YELLOW but went first `C_AI_Y_FIRST`

10% for ai putting his symbol to fully filled column `C_AI_OVERFLOW`

10% for ai move twice a row `C_AI_TWICE_A_ROW`

10% for ai flip table for correct move `C_AI_FLIP_TABLE_RANDOMLY`

3% for ai trying to put outside of  `C_AI_OUT_OF_BOUND`

3% for ai provide empty to column `C_AI_NIL`

4% for ai provide unknown action `C_AI_SURPRISE`

connect 4 baseline (20%): sequentially put to columns that are not full

10% for player being RED win us `BASE_AI_R`

10% for player being YELLOW win us `BASE_AI_Y`

connect 4 advance (30%): alpha beta pruning tree

15% for player being RED win `AB_AI_R`

15% for player being YELLOW win `AB_AI_Y`

I am expecting the participants will find some library or make/ clone an ui to play these boardgames as they are standard rules.
The game timer start only after they call the /tic-tac-toe/start or /connect4/start (still have some time limit),
so they dont need to play all these test cases simultaneously,
thus building an ui to play is possible,
just that the time limit is just few seconds only so they need to think fast and carefully not to break rules.
So the real challenge is actually wiring all the things up but not AI haha
