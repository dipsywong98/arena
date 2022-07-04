import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'

import express from 'express'
import 'express-async-errors'
import ticTacToeRouter from './ttt/router'
import quoridorRouter from './quoridor/router'

import { readFileSync } from 'fs'
import path from 'path'
import { ExpressAdapter } from '@bull-board/express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import marked = require('marked')
import basicAuth from 'express-basic-auth'
import adminRouter from './admin/router'
import { houseKeepQueue } from './common/houseKeeping'
import { getConcludeQueue, getConcludeWorker, getMoveQueue, getMoveWorker } from './common/queues'
import { appConfig } from './common/config'
import cors from 'cors'
import Connect4Router from './connect4/router'

const app = express()

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

if (appConfig.NODE_ENV !== 'test') {
  app.use(/.*admin.*/, basicAuth({
    challenge: true,
    authorizer: (_username: string, password: string) => {
      return password === (appConfig.ADMIN_PASSWORD ?? appConfig.AUTH_TOKEN)
    },
    unauthorizedResponse: 'Unauthorized'
  }))
}

// Show routes called in console during development
if (appConfig.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Security
if (appConfig.NODE_ENV === 'production') {
  app.use(helmet())
}

export const serverAdapter = new ExpressAdapter()

createBullBoard({
  queues: [
    new BullMQAdapter(getConcludeQueue()),
    new BullMQAdapter(getMoveQueue()),
    new BullMQAdapter(houseKeepQueue),
  ],
  serverAdapter
})

getMoveWorker()
getConcludeWorker()

serverAdapter.setBasePath('/admin/queues')

app.use('/403', (_req, res) => {
  res.status(403).send('Forbidden')
})
app.use('/admin/queues', serverAdapter.getRouter())
app.use('/admin', adminRouter)
app.use('/tic-tac-toe', ticTacToeRouter)
// app.use('/quoridor', quoridorRouter)
app.use('/connect4', Connect4Router)
const viewsDir = path.join(__dirname, '..', 'static')
app.use('/static', express.static(viewsDir))
app.post('/', (req, res) => {
  // eslint-disable-next-line no-console
  console.log(req.body)
  res.json(req.body)
})

const homeHtml = marked(readFileSync(path.join(__dirname, '..', 'readme.md'), { encoding: 'utf8' }))

app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link 
      rel="stylesheet"
      href="/static/github-markdown.css" /></head>
    <style>
    .markdown-body {
    box-sizing: border-box;
    min-width: 200px;
    max-width: 980px;
    margin: 0 auto;
    padding: 45px;
    }

    @media (max-width: 767px) {
    .markdown-body {
    padding: 15px;
    }
    }
</style>
    <body>
    <div class="markdown-body">
    ${homeHtml}
</div>
</body>
    </html>
    `)
})

// Export express instance
export default app
