const KEYWORD_RULES = [
    {
        taskType: 'extraction',
        keywords: ['extract', 'entities', 'emails', 'phone', 'cities', 'keywords'],
    },
    {
        taskType: 'code',
        keywords: [
            'function', 'python', 'javascript', 'java', 'c++',
            'algorithm', 'leetcode', 'bug', 'compile', 'sql',
        ],
    },
    {
        taskType: 'creative',
        keywords: ['poem', 'story', 'haiku', 'tagline', 'creative'],
    },
    {
        taskType: 'reasoning',
        keywords: ['calculate', 'solve', 'why', 'prove', 'reason', 'speed', 'probability'],
    },
];
export function heuristicClassify(prompt) {
    const lower = prompt.toLowerCase();
    for (const rule of KEYWORD_RULES) {
        const matched = rule.keywords.some((kw) => lower.includes(kw));
        if (matched) {
            return rule.taskType;
        }
    }
    return null;
}
//# sourceMappingURL=heuristicClassifier.js.map