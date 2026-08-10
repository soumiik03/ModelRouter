export interface ModelPerformance {
    modelId: string;
    taskType: string;
    avgQualityScore: number;
    avgCostUsd: number;
    avgLatencyMs: number;
    sampleCount: number;
}
export declare function getPerformanceStats(): Promise<ModelPerformance[]>;
export declare function getCachedPerformanceStats(): Promise<ModelPerformance[]>;
//# sourceMappingURL=performanceTracker.d.ts.map