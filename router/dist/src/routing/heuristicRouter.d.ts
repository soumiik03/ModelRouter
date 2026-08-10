import type { TaskType } from './classify.js';
interface Constraints {
    maxCostUsd?: number;
    maxLatencyMs?: number;
    minQuality?: number;
}
interface RoutingResult {
    modelId: string;
    reason: string;
}
export declare class ConstraintUnsatisfiableError extends Error {
    constructor(message: string);
}
export declare function selectModel(taskType: TaskType, constraints?: Constraints, prompt?: string): RoutingResult;
export {};
//# sourceMappingURL=heuristicRouter.d.ts.map