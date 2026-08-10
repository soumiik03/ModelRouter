import type { TaskType } from './classify.js';
interface RoutingResult {
    modelId: string;
    reason: string;
}
export declare function selectModelBandit(taskType: TaskType, constraints?: {
    maxCostUsd?: number;
    maxLatencyMs?: number;
    minQuality?: number;
}, prompt?: string): Promise<RoutingResult>;
export {};
//# sourceMappingURL=banditRouter.d.ts.map