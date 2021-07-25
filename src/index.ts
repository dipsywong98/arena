import dotenv from 'dotenv'
dotenv.config()
import app from '@server'
import logger from './logger'


// Start the server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  logger.info(`started server at http://localhost:${port}`)
});
