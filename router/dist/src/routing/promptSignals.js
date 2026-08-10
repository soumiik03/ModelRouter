export function analyzePrompt(prompt) {
    const promptLength = prompt.length;
    const estimatedTokens = Math.ceil(promptLength / 4);
    let complexitySignals = 0;
    if (promptLength > 500)
        complexitySignals++;
    if (/\b(refactor|architecture|design|optimize|debug)\b/i.test(prompt))
        complexitySignals++;
    if ((prompt.match(/\n/g) || []).length > 3)
        complexitySignals++;
    if (/\d+\.\s|\bstep \d/i.test(prompt))
        complexitySignals++;
    const complexityScore = Math.min(complexitySignals / 4, 1);
    const isLikelyMultiStep = /\d+\.\s|\bstep \d|\bthen\b.*\bthen\b/i.test(prompt);
    return { promptLength, estimatedTokens, complexityScore, isLikelyMultiStep };
}
//# sourceMappingURL=promptSignals.js.map