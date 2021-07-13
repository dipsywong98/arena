import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'

import express from 'express'
import StatusCodes from 'http-status-codes'
import 'express-async-errors'
import ticTacToeRouter from './tic-tac-toe'

import serverAdapter from './queues'

const app = express();
const { BAD_REQUEST } = StatusCodes;




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
