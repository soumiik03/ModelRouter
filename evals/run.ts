import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Dataset selection — switch with EVAL_DATASET=sample or EVAL_DATASET=full
// ---------------------------------------------------------------------------
const datasetMode = process.env.EVAL_DATASET === 'sample' ? 'sample' : 'full';
const datasetFile = datasetMode === 'sample' ? 'tasks-sample.json' : 'tasks.json';
const tasks = JSON.parse(readFileSync(path.resolve(__dirname, `datasets/${datasetFile}`), 'utf-8'));

console.log(`\n📂 Dataset: ${datasetFile} (${tasks.length} tasks)\n`);

const hasEvalRange = process.env.EVAL_START !== undefined || process.env.EVAL_END !== undefined;
const start = Number(process.env.EVAL_START ?? 0);
const end = Number(process.env.EVAL_END ?? tasks.length);

if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > tasks.length) {
  throw new Error('Invalid evaluation range: EVAL_START=' + (process.env.EVAL_START ?? 0) + ', EVAL_END=' + (process.env.EVAL_END ?? tasks.length));
}

const tasksToRun = tasks.slice(start, end);
const outputFile = hasEvalRange ? 'batch-' + (Math.floor(start / 15) + 1) + '.json' : 'raw-run.json';
if (hasEvalRange) {
  console.log('Running tasks ' + (start + 1) + '-' + end + ' of ' + tasks.length);
} else {
  console.log('Running full dataset (' + tasks.length + ' tasks)');
}
console.log('Saving results to ' + outputFile);
const BASE_URL = process.env.EVAL_BASE_URL || 'http://localhost:3000';
const DELAY_MS = 500; // stay under free-tier 20 req/min rate limit

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Strategy = 'always-cheap' | 'always-expensive' | 'heuristic-router' | 'learned-bandit';

interface EvalResult {
  taskId: string;
  category: string;
  strategy: Strategy;
  modelUsed: string | null;
  response: string | null;
  costUsd: number;
  latencyMs: number;
  classificationSource?: string | null;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CallRouteOptions {
  routingStrategy?: string;
}

async function callRoute(prompt: string, forceModel?: string, options?: CallRouteOptions) {
  const body = forceModel ? { prompt, model: forceModel } : { prompt };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options?.routingStrategy) {
    headers['x-routing-strategy'] = options.routingStrategy;
  }

  const res = await fetch(`${BASE_URL}/v1/route`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Main evaluation loop
// ---------------------------------------------------------------------------
async function runEval() {
  const results: EvalResult[] = [];
  const CHEAP_MODEL = 'openai/gpt-oss-20b:free';
  const EXPENSIVE_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

  let heuristicHits = 0;
  let llmFallbackHits = 0;

  for (const task of tasksToRun) {
    // ---- Baseline A: always cheapest ----
    console.log(`  [CHEAP]     ${task.id}`);
    try {
      const cheap = await callRoute(task.prompt, CHEAP_MODEL);
      results.push({
        taskId: task.id, category: task.category, strategy: 'always-cheap',
        modelUsed: cheap.modelUsed, response: cheap.text,
        costUsd: cheap.costUsd, latencyMs: cheap.latencyMs,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ CHEAP failed for ${task.id}: ${message}`);
      results.push({
        taskId: task.id, category: task.category, strategy: 'always-cheap',
        modelUsed: null, response: null, costUsd: 0, latencyMs: 0,
        error: message,
      });
    }
    await sleep(DELAY_MS);

    // ---- Baseline B: always expensive ----
    console.log(`  [EXPENSIVE] ${task.id}`);
    try {
      const expensive = await callRoute(task.prompt, EXPENSIVE_MODEL);
      results.push({
        taskId: task.id, category: task.category, strategy: 'always-expensive',
        modelUsed: expensive.modelUsed, response: expensive.text,
        costUsd: expensive.costUsd, latencyMs: expensive.latencyMs,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ EXPENSIVE failed for ${task.id}: ${message}`);
      results.push({
        taskId: task.id, category: task.category, strategy: 'always-expensive',
        modelUsed: null, response: null, costUsd: 0, latencyMs: 0,
        error: message,
      });
    }
    await sleep(DELAY_MS);

    // ---- Strategy C: heuristic router ----
    console.log(`  [ROUTER]    ${task.id}`);
    try {
      const routed = await callRoute(task.prompt);
      results.push({
        taskId: task.id, category: task.category, strategy: 'heuristic-router',
        modelUsed: routed.modelUsed, response: routed.text,
        costUsd: routed.costUsd, latencyMs: routed.latencyMs,
        classificationSource: routed.classificationSource ?? null,
      });

      // Track classification stats
      if (routed.classificationSource === 'heuristic') heuristicHits++;
      else llmFallbackHits++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ROUTER failed for ${task.id}: ${message}`);
      results.push({
        taskId: task.id, category: task.category, strategy: 'heuristic-router',
        modelUsed: null, response: null, costUsd: 0, latencyMs: 0,
        error: message,
      });
    }
    await sleep(DELAY_MS);

    // ---- Strategy D: learned bandit router ----
    console.log(`  [BANDIT]    ${task.id}`);
    try {
      const bandit = await callRoute(task.prompt, undefined, { routingStrategy: 'bandit' });
      results.push({
        taskId: task.id, category: task.category, strategy: 'learned-bandit',
        modelUsed: bandit.modelUsed, response: bandit.text,
        costUsd: bandit.costUsd, latencyMs: bandit.latencyMs,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ BANDIT failed for ${task.id}: ${message}`);
      results.push({
        taskId: task.id, category: task.category, strategy: 'learned-bandit',
        modelUsed: null, response: null, costUsd: 0, latencyMs: 0,
        error: message,
      });
    }
    await sleep(DELAY_MS);

    console.log(`  [DONE]      ${task.id}`);
  }

  // ---- Write results ----
  writeFileSync(path.resolve(__dirname, 'results', outputFile), JSON.stringify(results, null, 2));

  // ---- Summary ----
  const failures = results.filter((r) => r.error);
  const totalRouted = heuristicHits + llmFallbackHits;

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`  Eval run complete: ${results.length} results saved.`);

  if (failures.length > 0) {
    console.log(`  ⚠ Failures:       ${failures.length}`);
  }

  if (totalRouted > 0) {
    const heuristicPct = ((heuristicHits / totalRouted) * 100).toFixed(0);
    const llmPct = ((llmFallbackHits / totalRouted) * 100).toFixed(0);
    console.log(`\n  Classification Statistics`);
    console.log(`  Heuristic:         ${heuristicPct}% (${heuristicHits}/${totalRouted})`);
    console.log(`  LLM Fallback:      ${llmPct}% (${llmFallbackHits}/${totalRouted})`);
  }

  console.log(`${'─'.repeat(45)}\n`);
}

runEval().catch(console.error);