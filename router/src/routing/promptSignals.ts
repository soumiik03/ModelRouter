export interface PromptSignals {
    promptLength: number;        // character count
    estimatedTokens: number;     // rough estimate
    complexityScore: number;     // 0-1, heuristic-based
    isLikelyMultiStep: boolean;  // has numbered steps, "and then", etc.
}

export function analyzePrompt(prompt: string): PromptSignals {
    const promptLength = prompt.length;

    // rough token estimate — ~4 characters per token is a standard 
    // approximation for English text, good enough for routing decisions
    const estimatedTokens = Math.ceil(promptLength / 4);

    // complexity heuristics — none of these are "correct" in isolation,
    // together they're a reasonable signal
    let complexitySignals = 0;

    if (promptLength > 500) complexitySignals++;
    if (/\b(refactor|architecture|design|optimize|debug)\b/i.test(prompt)) complexitySignals++;
    if ((prompt.match(/\n/g) || []).length > 3) complexitySignals++; // multi-paragraph
    if (/\d+\.\s|\bstep \d/i.test(prompt)) complexitySignals++; // numbered steps

    const complexityScore = Math.min(complexitySignals / 4, 1);

    const isLikelyMultiStep = /\d+\.\s|\bstep \d|\bthen\b.*\bthen\b/i.test(prompt);

    return { promptLength, estimatedTokens, complexityScore, isLikelyMultiStep };
}