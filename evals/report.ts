import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { scoreCode } from './scoring/codeScorer.js';
import { scoreExactMatch } from './scoring/exactMatchScorer.js';
import { scoreExtraction } from './scoring/extractionScorer.js';

interface Task {
  id: string;
  category: string;
  prompt: string;
  expectedType: string;
  scoringMethod: string;
  testCases?: { input: string; expectedOutput: string }[];
  expectedAnswer?: string;
  expectedKeywords?: string[];
}

interface EvalResult {
  taskId: string;
  category: string;
  strategy: string;
  modelUsed: string | null;
  response?: string | null;
  costUsd: number;
  latencyMs: number;
  qualityScore?: number | null;
  classificationSource?: string | null;
  error?: string;
}

interface StrategySummary {
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

function computeModelBreakdown(rows: EvalResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    if (r.modelUsed) {
      counts[r.modelUsed] = (counts[r.modelUsed] ?? 0) + 1;
    }
  }
  return counts;
}

function findMostFrequent(counts: Record<string, number>): string {
  let maxModel = '—';
  let maxCount = 0;
  for (const [model, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxModel = model;
    }
  }
  return maxModel;
}

function computeQualityScore(result: EvalResult, task: Task | undefined): number | null {
  if (!task || result.error || !result.response) return null;

  switch (task.scoringMethod) {
    case 'unit-test':
      return scoreCode(result.response, task.testCases ?? []);
    case 'exact-match':
      return scoreExactMatch(result.response, task.expectedAnswer ?? '');
    case 'keyword-overlap':
      return scoreExtraction(result.response, task.expectedKeywords ?? []);
    case 'manual-rubric':
      return result.qualityScore ?? null;
    default:
      return null;
  }
}

function generateReport() {
  const raw: EvalResult[] = JSON.parse(readFileSync('evals/results/raw-run.json', 'utf-8'));

  // Load tasks dataset and build lookup map for scoring
  const datasetMode = process.env.EVAL_DATASET === 'sample' ? 'sample' : 'full';
  const datasetFile = datasetMode === 'sample' ? 'tasks-sample.json' : 'tasks.json';
  const tasks: Task[] = JSON.parse(readFileSync(path.resolve(__dirname, `datasets/${datasetFile}`), 'utf-8'));
  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));

  // Compute quality scores inline (raw-run.json may not have them pre-populated)
  for (const result of raw) {
    if (result.qualityScore == null) {
      result.qualityScore = computeQualityScore(result, taskMap.get(result.taskId));
    }
  }

  const strategies = ['always-cheap', 'always-expensive', 'heuristic-router', 'learned-bandit'];

  const summary: StrategySummary[] = strategies.map((strategy) => {
    const rows = raw.filter((r) => r.strategy === strategy);
    const successes = rows.filter((r) => !r.error);
    const failures = rows.filter((r) => r.error);

    const totalCost = successes.reduce((sum, r) => sum + r.costUsd, 0);
    const avgLatency = successes.length > 0
      ? successes.reduce((sum, r) => sum + r.latencyMs, 0) / successes.length
      : 0;
    const avgQuality = successes.length > 0
      ? successes.reduce((sum, r) => sum + (r.qualityScore ?? 0), 0) / successes.length
      : 0;

    const heuristicHits = rows.filter((r) => r.classificationSource === 'heuristic').length;
    const llmHits = rows.filter((r) => r.classificationSource === 'llm-fallback').length;
    const totalClassified = heuristicHits + llmHits;

    const heuristicHitRate = totalClassified > 0
      ? `${((heuristicHits / totalClassified) * 100).toFixed(0)}%`
      : '—';
    const llmFallbackRate = totalClassified > 0
      ? `${((llmHits / totalClassified) * 100).toFixed(0)}%`
      : '—';

    const modelBreakdown = computeModelBreakdown(successes);
    const mostFrequentModel = findMostFrequent(modelBreakdown);

    return {
      strategy,
      totalCost,
      avgLatencyMs: Math.round(avgLatency),
      avgQualityScore: avgQuality.toFixed(2),
      failureCount: failures.length,
      heuristicHitRate,
      llmFallbackRate,
      mostFrequentModel,
      modelBreakdown,
    };
  });

  console.log('\n═══════════════════════════════════════════════');
  console.log('  Evaluation Report');
  console.log('═══════════════════════════════════════════════\n');

  for (const s of summary) {
    console.log(`  ▸ ${s.strategy}`);
    console.log(`    Cost (total):       $${s.totalCost.toFixed(4)}`);
    console.log(`    Latency (avg):      ${s.avgLatencyMs}ms`);
    console.log(`    Quality (avg):      ${s.avgQualityScore}`);
    console.log(`    Failures:           ${s.failureCount}`);
    if (s.strategy === 'heuristic-router') {
      console.log(`    Heuristic hit rate: ${s.heuristicHitRate}`);
      console.log(`    LLM fallback rate:  ${s.llmFallbackRate}`);
    }
    console.log(`    Most used model:    ${s.mostFrequentModel}`);
    if (Object.keys(s.modelBreakdown).length > 1) {
      console.log(`    Model breakdown:`);
      for (const [model, count] of Object.entries(s.modelBreakdown)) {
        console.log(`      ${model}: ${count}`);
      }
    }
    console.log();
  }

  console.log('═══════════════════════════════════════════════\n');

  writeFileSync('evals/results/summary.json', JSON.stringify(summary, null, 2));
  console.log('Summary written to evals/results/summary.json');
}

generateReport();