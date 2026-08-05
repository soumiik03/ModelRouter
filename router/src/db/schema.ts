import { boolean, integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

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
});
