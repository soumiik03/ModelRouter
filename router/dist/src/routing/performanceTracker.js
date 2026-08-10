import { Pool } from 'pg';
const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : null;
export async function getPerformanceStats() {
    if (!pool) {
        return [];
    }
    const { rows } = await pool.query(`
    SELECT
      model_used    AS "modelId",
      task_type     AS "taskType",
      avg(quality_score) AS "avgQualityScore",
      avg(cost_usd)      AS "avgCostUsd",
      avg(latency_ms)    AS "avgLatencyMs",
      count(quality_score) AS "sampleCount"
    FROM request_logs
    WHERE task_type IS NOT NULL AND quality_score IS NOT NULL
    GROUP BY model_used, task_type
  `);
    return rows.map((r) => ({
        modelId: String(r.modelId),
        taskType: String(r.taskType),
        avgQualityScore: Number(r.avgQualityScore) || 0,
        avgCostUsd: Number(r.avgCostUsd) || 0,
        avgLatencyMs: Number(r.avgLatencyMs) || 0,
        sampleCount: Number(r.sampleCount) || 0,
    }));
}
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;
export async function getCachedPerformanceStats() {
    const now = Date.now();
    if (!cache || now - cacheTimestamp > CACHE_TTL_MS) {
        cache = await getPerformanceStats();
        cacheTimestamp = now;
    }
    return cache;
}
//# sourceMappingURL=performanceTracker.js.map