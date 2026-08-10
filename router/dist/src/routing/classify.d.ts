export type TaskType = 'code' | 'reasoning' | 'creative' | 'extraction' | 'chat';
export type ClassificationSource = 'heuristic' | 'llm-fallback';
export interface ClassificationResult {
    taskType: TaskType;
    source: ClassificationSource;
}
export declare function classifyTask(prompt: string): Promise<ClassificationResult>;
//# sourceMappingURL=classify.d.ts.map