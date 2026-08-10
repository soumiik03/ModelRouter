export interface PromptSignals {
    promptLength: number;
    estimatedTokens: number;
    complexityScore: number;
    isLikelyMultiStep: boolean;
}
export declare function analyzePrompt(prompt: string): PromptSignals;
//# sourceMappingURL=promptSignals.d.ts.map