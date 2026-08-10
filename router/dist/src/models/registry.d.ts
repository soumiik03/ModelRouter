export type QualityTier = 1 | 2 | 3 | 4 | 5;
export type LatencyBucket = 'fast' | 'medium' | 'slow';
export interface ModelConfig {
    id: string;
    label: string;
    costPerMInput: number;
    costPerMOutput: number;
    qualityTier: QualityTier;
    latencyBucket: LatencyBucket;
}
export declare const modelRegistry: ModelConfig[];
export declare function getModelById(id: string): ModelConfig | undefined;
//# sourceMappingURL=registry.d.ts.map