import { getModelById, modelRegistry } from '../models/registry.js';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
function isNonRetryable(status) {
    return status === 401 || status === 403;
}
function isRetryable(status) {
    return status === 429 || (status >= 500 && status < 600);
}
function isNetworkError(err) {
    if (!(err instanceof Error))
        return false;
    const code = err.code;
    return code === 'ECONNRESET'
        || code === 'ETIMEDOUT'
        || code === 'ENOTFOUND'
        || code === 'UND_ERR_CONNECT_TIMEOUT'
        || err.name === 'AbortError';
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function callModelOnce(modelId, prompt) {
    const start = Date.now();
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
    }
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
        }),
    });
    const responseText = await res.text();
    if (!res.ok) {
        const error = new Error(`OpenRouter error ${res.status}: ${responseText || 'no response body'}`);
        error.status = res.status;
        error.responseBody = responseText;
        throw error;
    }
    const data = responseText
        ? JSON.parse(responseText)
        : {
            choices: [],
            usage: {},
        };
    const latencyMs = Date.now() - start;
    return {
        text: data.choices?.[0]?.message?.content ?? '',
        tokensIn: data.usage?.prompt_tokens ?? 0,
        tokensOut: data.usage?.completion_tokens ?? 0,
        costUsd: 0,
        latencyMs,
    };
}
async function callModelWithRetry(modelId, prompt) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await callModelOnce(modelId, prompt);
        }
        catch (err) {
            lastError = err;
            const status = err.status;
            if (status !== undefined && isNonRetryable(status)) {
                console.error(`[openrouter] ${status} — not retryable (model=${modelId})`);
                throw err;
            }
            const shouldRetry = (status !== undefined && isRetryable(status)) || isNetworkError(err);
            if (!shouldRetry || attempt === MAX_RETRIES) {
                console.error(`[openrouter] request failed after ${attempt + 1} attempt(s) (model=${modelId})`, err instanceof Error ? err.message : err);
                throw err;
            }
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`[openrouter] attempt ${attempt + 1} failed (status=${status ?? 'network'}), retrying in ${delay}ms…`);
            await sleep(delay);
        }
    }
    throw lastError;
}
export async function callModel(modelId, prompt) {
    try {
        const result = await callModelWithRetry(modelId, prompt);
        return { ...result, modelUsed: modelId, wasFallback: false };
    }
    catch (err) {
        const failedModel = getModelById(modelId);
        const fallback = modelRegistry.find((m) => m.qualityTier === failedModel?.qualityTier && m.id !== modelId);
        if (!fallback)
            throw err;
        const result = await callModelWithRetry(fallback.id, prompt);
        return {
            ...result,
            modelUsed: fallback.id,
            wasFallback: true,
            fallbackFromModel: modelId,
        };
    }
}
//# sourceMappingURL=openrouter.js.map