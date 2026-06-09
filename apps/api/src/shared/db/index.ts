import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,
})

export const db = drizzle(client, { schema })

export type Database = typeof db
