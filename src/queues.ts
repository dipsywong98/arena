import { Job, Queue, Worker } from 'bullmq'

const { createBullBoard } = require('@bull-board/api')
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')

const redisConfig = {
  host: process.env.REDIS_URL,
  port: Number.parseInt(process.env.REDIS_PORT ?? '6379')
}

// Create a new connection in every instance
const myQueue = new Queue('myqueue', { connection: redisConfig});

const myWorker = new Worker('myqueue', async (job: Job, ...rest: unknown[])=>{
  console.log('hey', rest)
  return 'xfd'
}, { connection: redisConfig});

myWorker.on('completed', (_: Job, b: unknown) => console.log(b))
myWorker.on('error', console.error)

console.log('add ing')
myQueue.add('myqueue','456').catch(console.error)
myQueue.add('paint', { color: 'blue' }).catch(console.error)

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullMQAdapter(myQueue)
  ],
  serverAdapter
})

serverAdapter.setBasePath('/admin/queues')
export default serverAdapter
