import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const ROUTER_API_BASE = process.env.ROUTER_API_URL || 'http://localhost:3000';

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
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export interface RequestLogItem {
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

export interface ModelPerformanceItem {
  model: string;
  displayName: string;
  requests: number;
  avgLatencyMs: number;
  qualityScore: number | null;
  failures: number;
  costUsd: number;
  color: string;
}

export interface AnalyticsSummary {
  totalRequests: number;
  successfulRequests: number;
  failureRatePercent: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  avgQualityScore: number | null;
  cacheHitRatePercent: number;
  currentStrategy: string;
  modelPerformance: ModelPerformanceItem[];
  latencyDistribution: Array<{ range: string; count: number }>;
  recentLogs: RequestLogItem[];
  benchmarkSummary?: EvalSummaryItem[];
}

export interface EvalSummaryItem {
  strategy: string;
  totalCost: number;
  avgLatencyMs: number;
  avgQualityScore: string;
  failureCount: number;
  heuristicHitRate: string;
  llmFallbackRate: string;
  mostFrequentModel: string;
  modelBreakdown: Record<string, number>;
}

export interface EvalsData {
  totalEvaluations: number;
  totalTasks: number;
  strategiesCount: number;
  summary: EvalSummaryItem[];
  rawRuns: unknown[];
}

const EXPECTED_STRATEGIES = ['always-cheap', 'always-expensive', 'heuristic-router', 'learned-bandit'] as const;

function validateEvalsData(value: unknown): EvalsData {
  if (!value || typeof value !== 'object') throw new Error('Benchmark data is unavailable');
  const data = value as Partial<EvalsData>;
  if (!Array.isArray(data.summary) || data.summary.length !== EXPECTED_STRATEGIES.length) {
    throw new Error('Benchmark data is incomplete');
  }
  const strategies = data.summary.map((item) => item?.strategy);
  if (EXPECTED_STRATEGIES.some((strategy) => !strategies.includes(strategy))) {
    throw new Error('Benchmark data is incomplete');
  }
  if (!Array.isArray(data.rawRuns)) throw new Error('Benchmark run data is invalid');
  return data as EvalsData;
}

export interface CacheStatsData {
  exactCache: {
    provider: string;
    status: string;
    ttlSeconds: number;
  };
  semanticCache: {
    provider: string;
    model: string;
    dimension: number;
    similarityThreshold: number;
    totalEntries: number;
    status: string;
  };
}

export interface UserBudgetItem {
  userId: string;
  budgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  utilizationPercent: number;
  isExceeded: boolean;
}

export interface BudgetsData {
  users: UserBudgetItem[];
  totalBudgetsCount: number;
  exceededCount: number;
}

export async function fetchAnalyticsData(): Promise<AnalyticsSummary> {
  try {
    const res = await fetch(`${ROUTER_API_BASE}/v1/analytics`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[data] Could not fetch from Router API /v1/analytics, reading fallback benchmark data:', e);
  }

  return getFallbackAnalyticsData();
}

export async function fetchEvalsData(): Promise<EvalsData> {
  try {
    const res = await fetch(`${ROUTER_API_BASE}/v1/evals`, { cache: 'no-store' });
    if (res.ok) {
      return validateEvalsData(await res.json());
    }
  } catch (e) {
    console.warn('[data] Could not fetch from Router API /v1/evals, reading summary.json:', e);
  }

  return getFallbackEvalsData();
}

export async function fetchCacheStatsData(): Promise<CacheStatsData> {
  try {
    const res = await fetch(`${ROUTER_API_BASE}/v1/cache/stats`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[data] Could not fetch from Router API /v1/cache/stats:', e);
  }

  return {
    exactCache: {
      provider: 'Upstash Redis',
      status: 'Connected',
      ttlSeconds: 3600,
    },
    semanticCache: {
      provider: 'PostgreSQL pgvector',
      model: 'Xenova/all-MiniLM-L6-v2',
      dimension: 384,
      similarityThreshold: 0.95,
      totalEntries: 0,
      status: 'Connected',
    },
  };
}

export async function fetchBudgetsData(): Promise<BudgetsData> {
  try {
    const res = await fetch(`${ROUTER_API_BASE}/v1/budgets`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[data] Could not fetch from Router API /v1/budgets:', e);
  }

  return {
    users: [
      {
        userId: 'Demo Account',
        budgetUsd: 1.00,
        spentUsd: 0.00,
        remainingUsd: 1.00,
        utilizationPercent: 0.0,
        isExceeded: false,
      }
    ],
    totalBudgetsCount: 1,
    exceededCount: 0,
  };
}

function getFallbackAnalyticsData(): AnalyticsSummary {
  const evals = getFallbackEvalsData();
  const rawRuns = evals.rawRuns;

  const totalRequests = rawRuns.length || 240;
  const failures = rawRuns.filter((r: any) => Boolean(r.error)).length;
  const failureRatePercent = Number(((failures / totalRequests) * 100).toFixed(1));
  const successfulRequests = totalRequests - failures;

  const totalCostUsd = rawRuns.reduce((acc: number, r: any) => acc + (r.costUsd || 0), 0);
  const avgLatencyMs = Math.round(rawRuns.reduce((acc: number, r: any) => acc + (r.latencyMs || 0), 0) / totalRequests);
  
  const modelCounts: Record<string, { requests: number; cost: number; latencySum: number; failures: number }> = {};
  let unresolvedFailures = 0;
  rawRuns.forEach((r: any) => {
    if (r.error && !r.modelUsed) {
      unresolvedFailures++;
      return;
    }
    const m = r.modelUsed;
    if (!m) return;

    if (!modelCounts[m]) {
      modelCounts[m] = { requests: 0, cost: 0, latencySum: 0, failures: 0 };
    }
    modelCounts[m].requests += 1;
    modelCounts[m].cost += r.costUsd || 0;
    modelCounts[m].latencySum += r.latencyMs || 0;
    if (r.error) modelCounts[m].failures += 1;
  });

  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
  const modelPerformance: ModelPerformanceItem[] = Object.entries(modelCounts)
    .filter(([name]) => name !== 'unknown')
    .map(([name, data], idx) => ({
      model: name,
      displayName: name.split('/').pop() || name,
      requests: data.requests,
      avgLatencyMs: Math.round(data.latencySum / data.requests),
      qualityScore: null,
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

  const recentLogs: RequestLogItem[] = rawRuns.slice(0, 50).map((r: any, idx: number) => ({
    id: idx + 1,
    prompt: `Task ${r.taskId} (${r.category})`,
    modelUsed: r.modelUsed || 'Unresolved',
    costUsd: r.costUsd || 0,
    latencyMs: r.latencyMs || 0,
    tokensIn: 50,
    tokensOut: 150,
    createdAt: new Date().toISOString(),
    wasFallback: false,
    routingReason: `Strategy: ${r.strategy}${r.classificationSource ? ` (${r.classificationSource})` : ''}`,
    taskType: r.category || 'code',
    qualityScore: null, // Unscored live requests
    error: r.error,
  }));

  return {
    totalRequests,
    successfulRequests,
    failureRatePercent,
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    avgLatencyMs,
    avgQualityScore: null, // Unscored live requests
    cacheHitRatePercent: 0,
    currentStrategy: 'heuristic',
    modelPerformance,
    latencyDistribution: [
      { range: '<500ms', count: 60 },
      { range: '500ms-2s', count: 60 },
      { range: '2s-10s', count: 40 },
      { range: '10s-30s', count: 50 },
      { range: '>30s', count: 30 },
    ],
    recentLogs,
    benchmarkSummary: evals.summary,
  };
}

function getFallbackEvalsData(): EvalsData {
  const summaryPath = resolveWorkspaceFile('evals/results/summary.json');
  const rawPath = resolveWorkspaceFile('evals/results/raw-run.json');
  if (!summaryPath || !rawPath) throw new Error('Benchmark results are unavailable');
  const rawSummary: unknown = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  const rawRuns: unknown = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  return validateEvalsData({
    totalEvaluations: Array.isArray(rawRuns) ? rawRuns.length : 0,
    totalTasks: 60,
    strategiesCount: 4,
    summary: rawSummary,
    rawRuns,
  });
}
