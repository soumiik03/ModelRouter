import { Pool } from 'pg';

export interface LogRequestPayload {
  prompt: string;
  modelUsed: string;
  text: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  wasFallback?: boolean;
  fallbackFromModel?: string;
  taskType?: string | null;
  routingReason?: string | null;
  qualityScore?: number | null;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id SERIAL PRIMARY KEY,
      prompt TEXT NOT NULL,
      model_used TEXT NOT NULL,
      cost_usd REAL NOT NULL,
      latency_ms INTEGER NOT NULL,
      tokens_in INTEGER NOT NULL,
      tokens_out INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      was_fallback BOOLEAN DEFAULT FALSE,
      fallback_from_model TEXT,
      task_type TEXT,
      routing_reason TEXT,
      quality_score REAL
    )
  `);
}

export async function logRequest(payload: LogRequestPayload) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!schemaReady) {
    schemaReady = ensureSchema();
  }

  await schemaReady;

  const result = await pool.query(
    `
      INSERT INTO request_logs (
        prompt,
        model_used,
        cost_usd,
        latency_ms,
        tokens_in,
        tokens_out,
        was_fallback,
        fallback_from_model,
        task_type,
        routing_reason,
        quality_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `,
    [
      payload.prompt,
      payload.modelUsed,
      payload.costUsd,
      payload.latencyMs,
      payload.tokensIn,
      payload.tokensOut,
      payload.wasFallback ?? false,
      payload.fallbackFromModel ?? null,
      payload.taskType ?? null,
      payload.routingReason ?? null,
      payload.qualityScore ?? null,
    ]
  );

  return {
    ...payload,
    dbId: result.rows[0]?.id,
  };
}
