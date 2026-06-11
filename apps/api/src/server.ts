import 'dotenv/config'
import { createApp } from './app.js'

const app = await createApp()

const port = Number(process.env.PORT) || 3333
const host = '0.0.0.0'

try {
  await app.listen({ port, host })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
