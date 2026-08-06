import type { TaskType } from './classify.js';
import { modelRegistry, getModelById } from '../models/registry.js';
import { getCachedPerformanceStats } from './performanceTracker.js';
import type { ModelPerformance } from './performanceTracker.js';
import { selectModel as heuristicSelectModel } from './heuristicRouter.js'; // Ch 3 fallback
import { analyzePrompt } from './promptSignals.js';

const EPSILON = 0.1; // 10% explore, 90% exploit
const MIN_SAMPLES_TO_TRUST = 5; // don't trust a model's score until it's been tried enough

interface RoutingResult {
  modelId: string;
  reason: string;
}

function pickBestByScore(candidates: ModelPerformance[]): ModelPerformance {
  // simple weighted score: prioritize quality, mildly penalize cost/latency
  // tune these weights based on what you actually care about
  return candidates.reduce((best, current) => {
    const currentScore = current.avgQualityScore - current.avgCostUsd * 100;
    const bestScore = best.avgQualityScore - best.avgCostUsd * 100;
    return currentScore > bestScore ? current : best;
  });
}

export async function selectModelBandit(taskType: TaskType, constraints?: { maxCostUsd?: number; maxLatencyMs?: number; minQuality?: number; }, prompt = ''): Promise<RoutingResult> {
  const signals = analyzePrompt(prompt);

  if (signals.complexityScore > 0.5 || signals.estimatedTokens > 300) {
    const strongest = modelRegistry.filter((m) => m.qualityTier >= 4).sort((a, b) => b.qualityTier - a.qualityTier)[0];
    if (strongest && (!constraints?.minQuality || strongest.qualityTier >= constraints.minQuality) && (!constraints?.maxCostUsd || strongest.costPerMInput <= constraints.maxCostUsd)) {
      return { modelId: strongest.id, reason: 'bandit: complexity signal escalated to higher-tier model' };
    }
  }

  const stats = await getCachedPerformanceStats();
  const relevantStats = stats.filter(
    (s) => s.taskType === taskType && s.sampleCount >= MIN_SAMPLES_TO_TRUST
  ).filter(s => {
    // Filter out models that don't satisfy the constraints
    const m = getModelById(s.modelId);
    if (!m) return false;
    if (constraints?.minQuality !== undefined && m.qualityTier < constraints.minQuality) return false;
    if (constraints?.maxCostUsd !== undefined && m.costPerMInput > constraints.maxCostUsd) return false;
    // Note: We don't filter on latency bucket here, just cost and quality for simplicity
    return true;
  });

  // not enough historical data yet for this task type Ã¢â‚¬â€ fall back to
  // the Chapter 3 heuristic table until the bandit has something to learn from
  if (relevantStats.length === 0) {
    const fallback = heuristicSelectModel(taskType, constraints, prompt);
    return { modelId: fallback.modelId, reason: `bandit: insufficient data or no models satisfy constraints, using heuristic fallback` };
  }

  const explore = Math.random() < EPSILON;

  if (explore) {
    let candidateModels = modelRegistry;
    if (constraints) {
      candidateModels = modelRegistry.filter(m => {
        if (constraints.minQuality !== undefined && m.qualityTier < constraints.minQuality) return false;
        if (constraints.maxCostUsd !== undefined && m.costPerMInput > constraints.maxCostUsd) return false;
        return true;
      });
    }
    if (candidateModels.length === 0) {
      const fallback = heuristicSelectModel(taskType, constraints, prompt);
      return { modelId: fallback.modelId, reason: `bandit: no models for exploration satisfy constraints, using heuristic fallback` };
    }
    const randomModel = candidateModels[Math.floor(Math.random() * candidateModels.length)];
    if (!randomModel) {
      const fallback = heuristicSelectModel(taskType, constraints, prompt);
      return { modelId: fallback.modelId, reason: `bandit: explore failed, using heuristic fallback` };
    }
    return { modelId: randomModel.id, reason: `bandit: exploring (epsilon=${EPSILON})` };
  }

  const best = pickBestByScore(relevantStats);
  return { modelId: best.modelId, reason: `bandit: exploiting best-known model (score data from ${best.sampleCount} samples)` };
}