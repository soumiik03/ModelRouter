import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

interface EvalResult {
  taskId: string;
  strategy: string;
  [key: string]: unknown;
}

const resultsDir = path.resolve(__dirname, 'results');
const batchFiles = readdirSync(resultsDir)
  .filter((file) => /^batch-\d+\.json$/.test(file))
  .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));

const merged: EvalResult[] = [];
const seen = new Set<string>();

for (const file of batchFiles) {
  const results = JSON.parse(readFileSync(path.join(resultsDir, file), 'utf-8')) as EvalResult[];
  for (const result of results) {
    const key = result.taskId + '\u0000' + result.strategy;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(result);
  }
}

writeFileSync(path.join(resultsDir, 'raw-run.json'), JSON.stringify(merged, null, 2));
console.log('Merged ' + batchFiles.length + ' batch file(s): ' + merged.length + ' unique results written to evals/results/raw-run.json');