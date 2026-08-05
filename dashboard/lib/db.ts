import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, real, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import pg from 'pg';

export const requestLogs = pgTable('request_logs', {
  id: serial('id').primaryKey(),
  prompt: text('prompt').notNull(),
  modelUsed: text('model_used').notNull(),
  costUsd: real('cost_usd').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  tokensIn: integer('tokens_in').notNull(),
  tokensOut: integer('tokens_out').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  wasFallback: boolean('was_fallback').default(false),
  fallbackFromModel: text('fallback_from_model'),
  taskType: text('task_type'),
  routingReason: text('routing_reason'),
  qualityScore: real('quality_score'),
});

const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance && connectionString) {
    try {
      const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
      dbInstance = drizzle(pool);
    } catch (e) {
      console.warn('Postgres pool connection failed, using fallback:', e);
    }
  }
  return dbInstance;
}
