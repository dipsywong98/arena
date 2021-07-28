import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'

import express from 'express'
import 'express-async-errors'
import ticTacToeRouter from './ttt/router'

import { serverAdapter } from './ttt/queues'

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

app.use('/tic-tac-toe', ticTacToeRouter)
app.use('/admin/queues', serverAdapter.getRouter())
// const viewsDir = path.join(__dirname, 'views');
// app.use(express.static(viewsDir));
// app.get('*', (req: Request, res: Response) => {
    // res.sendFile('index.html', {root: viewsDir});
// });

// Export express instance
export default app;
