import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

interface LogEntry {
  id: number;
  prompt: string;
  modelUsed: string;
  costUsd: number;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  createdAt: string;
  wasFallback: boolean;
  routingReason: string;
  taskType: string;
  qualityScore: number | null;
  error?: string;
}

function resolveWorkspaceFile(targetPath: string): string | null {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const possiblePaths = [
    path.resolve(process.cwd(), targetPath),
    path.resolve(process.cwd(), '..', targetPath),
    path.resolve(moduleDir, '..', targetPath),
    path.resolve(moduleDir, '../..', targetPath),
    path.resolve(moduleDir, '../../..', targetPath),
    path.resolve(moduleDir, '../../../..', targetPath),
  ];
  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }
  return null;
}

const EXPECTED_STRATEGIES = ['always-cheap', 'always-expensive', 'heuristic-router', 'learned-bandit'] as const;

function loadBenchmarkSummary(): unknown[] {
  const summaryPath = resolveWorkspaceFile('evals/results/summary.json');
  if (!summaryPath) throw new Error('Benchmark results are unavailable');
  const parsed: unknown = JSON.parse(readFileSync(summaryPath, 'utf-8'));
  if (!Array.isArray(parsed) || parsed.length !== EXPECTED_STRATEGIES.length) {
    throw new Error('Benchmark results are incomplete');
  }
  const strategies = parsed.map((item) => (item && typeof item === 'object' && 'strategy' in item) ? item.strategy : undefined);
  if (EXPECTED_STRATEGIES.some((strategy) => !strategies.includes(strategy))) {
    throw new Error('Benchmark results are incomplete');
  }
  return parsed;
}

function loadRawBenchmarkRuns(): unknown[] {
  const rawPath = resolveWorkspaceFile('evals/results/raw-run.json');
  if (!rawPath) throw new Error('Benchmark run data is unavailable');
  const parsed: unknown = JSON.parse(readFileSync(rawPath, 'utf-8'));
  if (!Array.isArray(parsed)) throw new Error('Benchmark run data is invalid');
  return parsed;
}

export default async function analyticsRoutes(app: FastifyInstance) {
  // GET /v1/analytics - Real aggregate metrics & recent routing activity
  app.get('/v1/analytics', async (_req, reply) => {
    let dbLogs: LogEntry[] = [];

    if (pool) {
      try {
        const res = await pool.query(
          `SELECT id, prompt, model_used as "modelUsed", cost_usd as "costUsd", 
                  latency_ms as "latencyMs", tokens_in as "tokensIn", tokens_out as "tokensOut", 
                  created_at as "createdAt", was_fallback as "wasFallback", 
                  routing_reason as "routingReason", task_type as "taskType", 
                  quality_score as "qualityScore"
           FROM request_logs 
           ORDER BY created_at DESC 
           LIMIT 100`
        );
        dbLogs = res.rows;
      } catch (err) {
        app.log.warn({ err }, '[analytics] Failed to fetch request_logs from DB');
      }
    }

    const benchmarkSummary = loadBenchmarkSummary();

    // Runtime telemetry must remain separate from benchmark evaluations.
    const effectiveLogs: LogEntry[] = dbLogs;

    const totalRequests = effectiveLogs.length;
    const failures = effectiveLogs.filter((l: LogEntry) => Boolean(l.error)).length;
    const failureRatePercent = totalRequests > 0 ? Number(((failures / totalRequests) * 100).toFixed(1)) : 0;
    const successfulRequests = totalRequests - failures;

    const totalCostUsd = effectiveLogs.reduce((acc: number, l: LogEntry) => acc + (l.costUsd || 0), 0);
    const avgLatencyMs = totalRequests > 0 ? Math.round(effectiveLogs.reduce((acc: number, l: LogEntry) => acc + (l.latencyMs || 0), 0) / totalRequests) : 0;
    
    // Scored logs (only non-null quality scores from live request logs)
    const scoredLogs = effectiveLogs.filter((l: LogEntry) => l.qualityScore != null && l.qualityScore > 0);
    const avgQualityScore = scoredLogs.length > 0
      ? Number((scoredLogs.reduce((acc: number, l: LogEntry) => acc + (l.qualityScore ?? 0), 0) / scoredLogs.length).toFixed(2))
      : null;

    const cacheHits = effectiveLogs.filter((l: LogEntry) => l.routingReason?.toLowerCase().includes('cache')).length;
    const cacheHitRatePercent = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;

    // Model breakdown
    const modelCounts: Record<string, { requests: number; cost: number; latencySum: number; failures: number; qualitySum: number; qualityCount: number }> = {};
    let unresolvedFailures = 0;
    
    effectiveLogs.forEach((l: LogEntry) => {
      if (l.error && !l.modelUsed) {
        unresolvedFailures++;
        return;
      }
      
      const m = l.modelUsed;
      if (!m) return;
      
      if (!modelCounts[m]) {
        modelCounts[m] = { requests: 0, cost: 0, latencySum: 0, failures: 0, qualitySum: 0, qualityCount: 0 };
      }
      modelCounts[m].requests += 1;
      modelCounts[m].cost += l.costUsd || 0;
      modelCounts[m].latencySum += l.latencyMs || 0;
      if (l.error) modelCounts[m].failures += 1;
      if (l.qualityScore != null && l.qualityScore > 0) {
        modelCounts[m].qualitySum += l.qualityScore;
        modelCounts[m].qualityCount += 1;
      }
    });

    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
    const modelPerformance = Object.entries(modelCounts)
      .filter(([name]) => name !== 'unknown')
      .map(([name, data], idx) => ({
      model: name,
      displayName: name.split('/').pop() || name,
      requests: data.requests,
      avgLatencyMs: Math.round(data.latencySum / data.requests),
      qualityScore: data.qualityCount > 0 ? Number((data.qualitySum / data.qualityCount).toFixed(2)) : null,
      failures: data.failures,
      costUsd: Number(data.cost.toFixed(5)),
      color: colors[idx % colors.length]
    }));
    
    if (unresolvedFailures > 0) {
      modelPerformance.push({
        model: 'unresolved_failures',
        displayName: 'Routing Failures',
        requests: unresolvedFailures,
        avgLatencyMs: 0,
        qualityScore: null,
        failures: unresolvedFailures,
        costUsd: 0,
        color: '#ef4444' // red
      });
    }

    // Latency Distribution Buckets
    let b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    effectiveLogs.forEach((l: LogEntry) => {
      const ms = l.latencyMs || 0;
      if (ms < 500) b1++;
      else if (ms < 2000) b2++;
      else if (ms < 10000) b3++;
      else if (ms < 30000) b4++;
      else b5++;
    });

    const latencyDistribution = [
      { range: '<500ms', count: b1 },
      { range: '500ms-2s', count: b2 },
      { range: '2s-10s', count: b3 },
      { range: '10s-30s', count: b4 },
      { range: '>30s', count: b5 },
    ];

    const currentStrategy = process.env.ROUTING_STRATEGY || 'heuristic';

    return reply.send({
      totalRequests,
      successfulRequests,
      failureRatePercent,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      avgLatencyMs,
      avgQualityScore,
      cacheHitRatePercent,
      currentStrategy,
      modelPerformance,
      latencyDistribution,
      recentLogs: effectiveLogs.slice(0, 50),
      benchmarkSummary,
    });
  });

  // GET /v1/evals - 60-Task Benchmark results
  app.get('/v1/evals', async (_req, reply) => {
    const summary = loadBenchmarkSummary();
    const raw = loadRawBenchmarkRuns();

    return reply.send({
      totalEvaluations: raw.length || 240,
      totalTasks: 60,
      strategiesCount: 4,
      summary: summary || [],
      rawRuns: raw,
    });
  });

  // GET /v1/cache/stats - Cache monitoring statistics
  app.get('/v1/cache/stats', async (_req, reply) => {
    let semanticCacheEntries = 0;

    if (pool) {
      try {
        const res = await pool.query('SELECT COUNT(*) as count FROM semantic_cache');
        semanticCacheEntries = parseInt(res.rows[0]?.count || '0', 10);
      } catch (err) {
        app.log.warn({ err }, '[cache/stats] Failed to count semantic_cache');
      }
    }

    const isRedisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

    return reply.send({
      exactCache: {
        provider: isRedisConfigured ? 'Upstash Redis' : 'In-Memory Fallback',
        status: isRedisConfigured ? 'Connected' : 'Fallback Active',
        ttlSeconds: 3600,
      },
      semanticCache: {
        provider: 'PostgreSQL pgvector',
        model: 'Xenova/all-MiniLM-L6-v2',
        dimension: 384,
        similarityThreshold: 0.95,
        totalEntries: semanticCacheEntries,
        status: pool ? 'Connected' : 'disabled (no DB_URL)',
      },
    });
  });

  // GET /v1/budgets - User budget tracking stats
  app.get('/v1/budgets', async (_req, reply) => {
    let budgets: any[] = [];

    if (pool) {
      try {
        const res = await pool.query('SELECT user_id as "userId", budget_usd as "budgetUsd", spent_usd as "spentUsd" FROM user_budgets');
        budgets = res.rows.map((r: any) => ({
          userId: r.userId,
          budgetUsd: Number(r.budgetUsd),
          spentUsd: Number(r.spentUsd),
          remainingUsd: Number(Math.max(0, r.budgetUsd - r.spentUsd).toFixed(4)),
          utilizationPercent: Number(((r.spentUsd / r.budgetUsd) * 100).toFixed(1)),
          isExceeded: r.spentUsd >= r.budgetUsd,
        }));
      } catch (err) {
        app.log.warn({ err }, '[budgets] Failed to query user_budgets');
      }
    }

    if (budgets.length === 0) {
      budgets = [
        {
          userId: 'Demo Account',
          budgetUsd: 1.00,
          spentUsd: 0.00,
          remainingUsd: 1.00,
          utilizationPercent: 0.0,
          isExceeded: false,
        }
      ];
    }

    return reply.send({
      users: budgets,
      totalBudgetsCount: budgets.length,
      exceededCount: budgets.filter((b: any) => b.isExceeded).length,
    });
  });
}
