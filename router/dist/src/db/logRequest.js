import { Pool } from 'pg';
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
let schemaReady = null;
async function ensureSchema() {
    if (!pool)
        throw new Error('DATABASE_URL is not configured');
    await pool.query('CREATE TABLE IF NOT EXISTS request_logs (id SERIAL PRIMARY KEY, prompt TEXT NOT NULL, model_used TEXT NOT NULL, cost_usd REAL NOT NULL, latency_ms INTEGER NOT NULL, tokens_in INTEGER NOT NULL, tokens_out INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, was_fallback BOOLEAN DEFAULT FALSE, fallback_from_model TEXT, task_type TEXT, routing_reason TEXT, quality_score REAL, prompt_length INTEGER, estimated_tokens INTEGER, complexity_score REAL, is_likely_multi_step BOOLEAN)');
    await pool.query('ALTER TABLE request_logs ADD COLUMN IF NOT EXISTS prompt_length INTEGER');
    await pool.query('ALTER TABLE request_logs ADD COLUMN IF NOT EXISTS estimated_tokens INTEGER');
    await pool.query('ALTER TABLE request_logs ADD COLUMN IF NOT EXISTS complexity_score REAL');
    await pool.query('ALTER TABLE request_logs ADD COLUMN IF NOT EXISTS is_likely_multi_step BOOLEAN');
}
export async function logRequest(payload) {
    if (!pool)
        throw new Error('DATABASE_URL is not configured');
    if (!schemaReady)
        schemaReady = ensureSchema();
    await schemaReady;
    const result = await pool.query('INSERT INTO request_logs (prompt, model_used, cost_usd, latency_ms, tokens_in, tokens_out, was_fallback, fallback_from_model, task_type, routing_reason, quality_score, prompt_length, estimated_tokens, complexity_score, is_likely_multi_step) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id', [payload.prompt, payload.modelUsed, payload.costUsd, payload.latencyMs, payload.tokensIn, payload.tokensOut, payload.wasFallback ?? false, payload.fallbackFromModel ?? null, payload.taskType ?? null, payload.routingReason ?? null, payload.qualityScore ?? null, payload.promptLength ?? null, payload.estimatedTokens ?? null, payload.complexityScore ?? null, payload.isLikelyMultiStep ?? null]);
    return { ...payload, dbId: result.rows[0]?.id };
}
//# sourceMappingURL=logRequest.js.map