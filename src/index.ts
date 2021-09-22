import dotenv from 'dotenv'
dotenv.config()
import app from '@server'
import logger from './common/logger'
import { appConfig } from './common/config';


// Start the server
const port = appConfig.PORT;
app.listen(port, () => {
  logger.info(`started server at http://localhost:${port}`)
});
