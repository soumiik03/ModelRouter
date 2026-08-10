import { callModel } from '../providers/openrouter.js';
import { heuristicClassify } from './heuristicClassifier.js';

export type TaskType = 'code' | 'reasoning' | 'creative' | 'extraction' | 'chat';

export type ClassificationSource = 'heuristic' | 'llm-fallback';

export interface ClassificationResult {
  taskType: TaskType;
  source: ClassificationSource;
}

const VALID_TYPES: TaskType[] = ['code', 'reasoning', 'creative', 'extraction', 'chat'];

export async function classifyTask(prompt: string): Promise<ClassificationResult> {
  const heuristicResult = heuristicClassify(prompt);
  if (heuristicResult !== null) {
    return { taskType: heuristicResult, source: 'heuristic' };
  }

  const classifierPrompt = `Classify the following prompt into exactly one category: code, reasoning, creative, extraction, or chat.
Respond with ONLY the single category word, nothing else.

Prompt: "${prompt}"

Category:`;

  const result = await callModel('openai/gpt-oss-20b:free', classifierPrompt);
  const cleaned = result.text.trim().toLowerCase();

  if (VALID_TYPES.includes(cleaned as TaskType)) {
    return { taskType: cleaned as TaskType, source: 'llm-fallback' };
  }

  return { taskType: 'chat', source: 'llm-fallback' };
}