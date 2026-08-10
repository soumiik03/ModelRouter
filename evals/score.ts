import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../router/.env') });

import { scoreCode } from './scoring/codeScorer.js';
import { scoreExactMatch } from './scoring/exactMatchScorer.js';
import { scoreExtraction } from './scoring/extractionScorer.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required to write scores back to the DB.");
  process.exit(1);
}

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

const datasetMode = process.env.EVAL_DATASET === 'sample' ? 'sample' : 'full';
const datasetFile = datasetMode === 'sample' ? 'tasks-sample.json' : 'tasks.json';
const tasks: Task[] = JSON.parse(readFileSync(path.resolve(__dirname, `datasets/${datasetFile}`), 'utf-8'));
const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));

const resultsFile = path.resolve(__dirname, 'results/raw-run.json');
const results = JSON.parse(readFileSync(resultsFile, 'utf-8'));

for (const result of results) {
  const task = taskMap.get(result.taskId);
  if (!task || result.error || !result.response) {
    result.qualityScore = null;
    continue;
  }

  switch (task.scoringMethod) {
    case 'unit-test':
      result.qualityScore = scoreCode(result.response, task.testCases ?? []);
      break;
    case 'exact-match':
      result.qualityScore = scoreExactMatch(result.response, task.expectedAnswer ?? '');
      break;
    case 'keyword-overlap':
      result.qualityScore = scoreExtraction(result.response, task.expectedKeywords ?? []);
      break;
    case 'manual-rubric':
      result.qualityScore = result.qualityScore ?? null;
      break;
    default:
      result.qualityScore = null;
  }
}

writeFileSync(resultsFile, JSON.stringify(results, null, 2));
console.log(`Scored ${results.filter((r: any) => r.qualityScore !== null).length}/${results.length} results`);

import('pg').then(async ({ Pool }) => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  let updated = 0;
  
  for (const result of results) {
    if (result.qualityScore == null || result.modelUsed == null || !result.response) continue;
    
    const res = await pool.query(
      `UPDATE request_logs 
       SET quality_score = $1
       WHERE id = (
         SELECT id FROM request_logs 
         WHERE model_used = $2 AND quality_score IS NULL 
         -- Use a prefix match on prompt since we don't have the exact prompt stored in EvalResult (only taskId)
         -- Actually, we can get the prompt from the task map!
         AND prompt = $3
         ORDER BY created_at DESC 
         LIMIT 1
       )`,
      [result.qualityScore, result.modelUsed, taskMap.get(result.taskId)?.prompt]
    );
    updated += res.rowCount ?? 0;
  }
  
  console.log(`Updated ${updated} rows in DB with quality scores`);
  await pool.end();
}).catch(console.error);
