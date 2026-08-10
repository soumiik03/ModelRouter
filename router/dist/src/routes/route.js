import { callModel } from '../providers/openrouter.js';
import { getModelById } from '../models/registry.js';
import { logRequest } from '../db/logRequest.js';
import { classifyTask } from '../routing/classify.js';
import { ConstraintUnsatisfiableError, selectModel } from '../routing/heuristicRouter.js';
import { selectModelBandit } from '../routing/banditRouter.js';
import { getExactMatch, setExactMatch } from '../cache/exactMatch.js';
import { checkSemanticCache, saveSemanticCache } from '../cache/semanticCache.js';
import { checkBudget, chargeBudget, BudgetExceededError } from '../budget/tracker.js';
import { analyzePrompt } from '../routing/promptSignals.js';
function getErrorDetails(err) {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message,
            stack: err.stack,
        };
    }
    return {
        name: 'UnknownError',
        message: String(err),
        stack: undefined,
    };
}
export default async function routeRoutes(app) {
    app.post('/v1/route', async (req, reply) => {
        const body = (req.body ?? {});
        const { prompt, model, constraints, userId } = body;
        if (typeof prompt !== 'string' || prompt.trim() === '') {
            return reply.code(400).send({ error: 'Missing prompt' });
        }
        try {
            if (userId) {
                await checkBudget(userId);
            }
        }
        catch (err) {
            if (err instanceof BudgetExceededError) {
                return reply.code(429).send({ error: err.message });
            }
            throw err;
        }
        let selectedModel;
        let taskType;
        let classificationSource;
        let routingReason;
        let providerResult;
        try {
            if (model) {
                selectedModel = getModelById(model);
                if (!selectedModel) {
                    return reply.code(400).send({ error: `Unknown model: ${model}` });
                }
            }
            else {
                const classification = await classifyTask(prompt);
                taskType = classification.taskType;
                classificationSource = classification.source;
                const strategyHeader = req.headers['x-routing-strategy']?.trim();
                const useBandit = strategyHeader === 'bandit' ||
                    (!strategyHeader && process.env.ROUTING_STRATEGY === 'bandit');
                const routingResult = useBandit
                    ? await selectModelBandit(taskType, constraints, prompt)
                    : selectModel(taskType, constraints, prompt);
                routingReason = routingResult.reason;
                selectedModel = getModelById(routingResult.modelId);
                if (!selectedModel) {
                    throw new Error(`Selected model not found: ${routingResult.modelId}`);
                }
            }
            if (selectedModel) {
                const exactCached = await getExactMatch(prompt, selectedModel.id);
                if (exactCached) {
                    return {
                        ...exactCached,
                        classificationSource: classificationSource ?? null,
                        cached: 'exact',
                        costUsd: 0,
                        latencyMs: 0
                    };
                }
            }
            if (!model) {
                const semanticCached = await checkSemanticCache(prompt);
                if (semanticCached) {
                    return {
                        ...semanticCached,
                        classificationSource: classificationSource ?? null,
                        cached: 'semantic',
                        costUsd: 0,
                        latencyMs: 0
                    };
                }
            }
            providerResult = await callModel(selectedModel.id, prompt);
            setExactMatch(prompt, selectedModel.id, providerResult).catch(e => req.log.error(e, 'Failed to save exact match cache'));
            if (!model) {
                saveSemanticCache(prompt, providerResult, selectedModel.id).catch(e => req.log.error(e, 'Failed to save semantic cache'));
            }
            if (userId && providerResult.costUsd > 0) {
                chargeBudget(userId, providerResult.costUsd).catch(e => req.log.error(e, 'Failed to charge budget'));
            }
            try {
                await logRequest({
                    prompt,
                    taskType: taskType ?? null,
                    routingReason: routingReason ?? null,
                    ...analyzePrompt(prompt),
                    ...providerResult,
                });
            }
            catch (logErr) {
                req.log.warn({
                    err: getErrorDetails(logErr),
                    requestBody: body,
                    prompt,
                    requestedModel: model,
                    selectedModel: selectedModel?.id,
                    taskType,
                    routingReason,
                    openRouterResponse: providerResult,
                }, '[route] request logging failed; continuing without persistence');
            }
            return {
                ...providerResult,
                classificationSource: classificationSource ?? null,
            };
        }
        catch (err) {
            if (err instanceof ConstraintUnsatisfiableError) {
                return reply.code(422).send({ error: err.message });
            }
            const errorDetails = getErrorDetails(err);
            req.log.error({
                err: errorDetails,
                requestBody: body,
                prompt,
                requestedModel: model,
                selectedModel: selectedModel?.id,
                taskType,
                routingReason,
                openRouterResponse: providerResult,
            }, '[route] /v1/route failed');
            if (err instanceof Error) {
                return reply.code(500).send({ error: err.message });
            }
            throw err;
        }
    });
}
//# sourceMappingURL=route.js.map