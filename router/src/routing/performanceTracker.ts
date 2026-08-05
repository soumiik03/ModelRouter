import { Pool } from 'pg';

export interface ModelPerformance {
  modelId: string;
  taskType: string;
  avgQualityScore: number;
  avgCostUsd: number;
  avgLatencyMs: number;
  sampleCount: number;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// Pulls aggregated stats per model+taskType combo from real request history.
// Note: qualityScore only exists on rows scored by your eval harness —
// live production traffic won't have this unless you also score it,
// so this initially only reflects Chapter 4's eval runs. That's fine —
// it's your bootstrap dataset.
export async function getPerformanceStats(): Promise<ModelPerformance[]> {
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

  return rows.map((r: Record<string, unknown>) => ({
    modelId: String(r.modelId),
    taskType: String(r.taskType),
    avgQualityScore: Number(r.avgQualityScore) || 0,
    avgCostUsd: Number(r.avgCostUsd) || 0,
    avgLatencyMs: Number(r.avgLatencyMs) || 0,
    sampleCount: Number(r.sampleCount) || 0,
  }));
}

// simple in-memory cache so you're not hitting Postgres on every single
// routing decision — refresh every N minutes instead
let cache: ModelPerformance[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCachedPerformanceStats(): Promise<ModelPerformance[]> {
  const now = Date.now();
  if (!cache || now - cacheTimestamp > CACHE_TTL_MS) {
    cache = await getPerformanceStats();
    cacheTimestamp = now;
  }
  return cache;
}