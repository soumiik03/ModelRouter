import { modelRegistry, getModelById } from '../models/registry.js';
import { analyzePrompt } from './promptSignals.js';
const TASK_MODEL_MAP = {
    code: 'cohere/north-mini-code:free',
    reasoning: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    creative: 'nvidia/nemotron-3-super-120b-a12b:free',
    extraction: 'nvidia/nemotron-3-super-120b-a12b:free',
    chat: 'openai/gpt-oss-20b:free',
};
export class ConstraintUnsatisfiableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConstraintUnsatisfiableError';
    }
}
export function selectModel(taskType, constraints, prompt = '') {
    const signals = analyzePrompt(prompt);
    if (constraints?.maxCostUsd !== undefined && constraints.maxCostUsd < 0.001) {
        const cheapModel = getModelById('openai/gpt-oss-20b:free');
        if (cheapModel) {
            return { modelId: cheapModel.id, reason: 'cost constraint forced cheapest model' };
        }
    }
    const candidates = modelRegistry.filter((m) => {
        if (constraints?.minQuality !== undefined && m.qualityTier < constraints.minQuality) {
            return false;
        }
        if (constraints?.maxCostUsd !== undefined && m.costPerMInput > constraints.maxCostUsd) {
            return false;
        }
        return true;
    });
    if (candidates.length === 0) {
        throw new ConstraintUnsatisfiableError(`No model in the pool satisfies the given constraints: ${JSON.stringify(constraints)}`);
    }
    if (signals.complexityScore > 0.5 || signals.estimatedTokens > 300) {
        const strongest = [...candidates].filter((m) => m.qualityTier >= 4).sort((a, b) => b.qualityTier - a.qualityTier)[0];
        if (strongest) {
            return { modelId: strongest.id, reason: 'complexity signal (score=' + signals.complexityScore.toFixed(2) + ', ~' + signals.estimatedTokens + ' tokens) escalated to higher-tier model' };
        }
    }
    const preferredId = TASK_MODEL_MAP[taskType];
    const preferredStillValid = candidates.some((m) => m.id === preferredId);
    if (preferredStillValid) {
        return { modelId: preferredId, reason: `task type "${taskType}" mapped to preferred model` };
    }
    const best = [...candidates].sort((a, b) => b.qualityTier - a.qualityTier)[0];
    if (!best) {
        throw new ConstraintUnsatisfiableError(`No model in the pool satisfies the given constraints: ${JSON.stringify(constraints)}`);
    }
    return { modelId: best.id, reason: 'preferred model excluded by constraints, chose next best' };
}
//# sourceMappingURL=heuristicRouter.js.map