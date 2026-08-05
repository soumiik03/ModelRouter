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
  qualityScore: real('quality_score'),
});

export const semanticCache = pgTable('semantic_cache', {
  id: serial('id').primaryKey(),
  prompt: text('prompt').notNull(),
  promptEmbedding: text('prompt_embedding').notNull(), // MiniLM is 384d, stored as vector but mapped as text here
  response: text('response').notNull(),
  modelUsed: text('model_used').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userBudgets = pgTable('user_budgets', {
  userId: text('user_id').primaryKey(),
  budgetUsd: real('budget_usd').notNull(),
  spentUsd: real('spent_usd').notNull().default(0),
});
