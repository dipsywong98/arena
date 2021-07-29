import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'

import express from 'express'
import 'express-async-errors'
import ticTacToeRouter from './ttt/router'

import { serverAdapter } from './ttt/queues'
import { readFileSync } from 'fs'
import marked from 'marked'
import path from 'path'

const app = express()

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Security
if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}

app.use('/tic-tac-toe', ticTacToeRouter)
app.use('/admin/queues', serverAdapter.getRouter())
const viewsDir = path.join(__dirname, '..', 'static')
app.use('/static', express.static(viewsDir))

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
