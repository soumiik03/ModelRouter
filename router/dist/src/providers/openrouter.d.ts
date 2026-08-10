interface CallResult {
    text: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    modelUsed: string;
    wasFallback: boolean;
    fallbackFromModel?: string;
}
export declare function callModel(modelId: string, prompt: string): Promise<CallResult>;
export {};
//# sourceMappingURL=openrouter.d.ts.map