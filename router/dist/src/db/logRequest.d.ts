export interface LogRequestPayload {
    prompt: string;
    modelUsed: string;
    text: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    wasFallback?: boolean;
    fallbackFromModel?: string;
    taskType?: string | null;
    routingReason?: string | null;
    qualityScore?: number | null;
    promptLength?: number;
    estimatedTokens?: number;
    complexityScore?: number;
    isLikelyMultiStep?: boolean;
}
export declare function logRequest(payload: LogRequestPayload): Promise<{
    prompt: string;
    modelUsed: string;
    text: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    wasFallback?: boolean;
    fallbackFromModel?: string;
    taskType?: string | null;
    routingReason?: string | null;
    qualityScore?: number | null;
    promptLength?: number;
    estimatedTokens?: number;
    complexityScore?: number;
    isLikelyMultiStep?: boolean;
    dbId: any;
}>;
//# sourceMappingURL=logRequest.d.ts.map