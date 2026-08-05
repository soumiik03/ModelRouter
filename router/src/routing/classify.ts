import { callModel } from '../providers/openrouter.js';
import { heuristicClassify } from './heuristicClassifier.js';

export type TaskType = 'code' | 'reasoning' | 'creative' | 'extraction' | 'chat';

export type ClassificationSource = 'heuristic' | 'llm-fallback';

export interface ClassificationResult {
  taskType: TaskType;
  source: ClassificationSource;
}

const VALID_TYPES: TaskType[] = ['code', 'reasoning', 'creative', 'extraction', 'chat'];

/**
 * Two-layer classifier: tries fast keyword heuristics first,
 * falls back to an LLM call only when the heuristic is inconclusive.
 */
export async function classifyTask(prompt: string): Promise<ClassificationResult> {
  // Layer 1: heuristic — zero cost, zero latency
  const heuristicResult = heuristicClassify(prompt);
  if (heuristicResult !== null) {
    return { taskType: heuristicResult, source: 'heuristic' };
  }

  // Layer 2: LLM fallback — costs one API call
  const classifierPrompt = `Classify the following prompt into exactly one category: code, reasoning, creative, extraction, or chat.
Respond with ONLY the single category word, nothing else.

Prompt: "${prompt}"

Category:`;

  const result = await callModel('openai/gpt-oss-20b:free', classifierPrompt);
  const cleaned = result.text.trim().toLowerCase();

  if (VALID_TYPES.includes(cleaned as TaskType)) {
    return { taskType: cleaned as TaskType, source: 'llm-fallback' };
  }

  // model didn't return a clean label — don't crash, default safely
  return { taskType: 'chat', source: 'llm-fallback' };
}