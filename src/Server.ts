import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'

import express from 'express'
import 'express-async-errors'
import { makeRouter } from './ttt/router'

import { battleQueue, moveQueue, scoreQueue, serverAdapter } from './ttt/queues'
import { AppContext } from './ttt/common'
import { makeRedis } from './redis'

const appContext: AppContext = {
    battleQueue: battleQueue, incomingMoveQueue: moveQueue, pubRedis: makeRedis(), subRedis: makeRedis(), scoreQueue: scoreQueue
}
const ticTacToeRouter = makeRouter(appContext)
const app = express();

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
}

console.log('hi')
app.use('/tic-tac-toe', ticTacToeRouter)
app.use('/admin/queues', serverAdapter.getRouter())
// const viewsDir = path.join(__dirname, 'views');
// app.use(express.static(viewsDir));
// app.get('*', (req: Request, res: Response) => {
    // res.sendFile('index.html', {root: viewsDir});
// });

// Export express instance
export default app;
