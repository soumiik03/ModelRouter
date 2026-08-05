import type { FastifyInstance } from 'fastify';
import { callModel } from '../providers/openrouter.js';
import { getModelById } from '../models/registry.js';
import { logRequest } from '../db/logRequest.js';
import { classifyTask } from '../routing/classify.js';
import type { TaskType, ClassificationSource } from '../routing/classify.js';
import { ConstraintUnsatisfiableError, selectModel } from '../routing/heuristicRouter.js';
import { selectModelBandit } from '../routing/banditRouter.js';
import { getExactMatch, setExactMatch } from '../cache/exactMatch.js';
import { checkSemanticCache, saveSemanticCache } from '../cache/semanticCache.js';
import { checkBudget, chargeBudget, BudgetExceededError } from '../budget/tracker.js';

interface RouteRequestBody {
  prompt: string;
  model?: string;
  constraints?: {
    maxCostUsd?: number;
    maxLatencyMs?: number;
    minQuality?: number;
  };
  userId?: string;
}

function getErrorDetails(err: unknown) {
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

export default async function routeRoutes(app: FastifyInstance) {
  app.post<{ Body: RouteRequestBody }>('/v1/route', async (req, reply) => {
    const body = (req.body ?? {}) as RouteRequestBody;
    const { prompt, model, constraints, userId } = body;

    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return reply.code(400).send({ error: 'Missing prompt' });
    }

    try {
      if (userId) {
        await checkBudget(userId);
      }
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        return reply.code(429).send({ error: err.message });
      }
      throw err;
    }

    let selectedModel: { id: string } | undefined;
    let taskType: TaskType | undefined;
    let classificationSource: ClassificationSource | undefined;
    let routingReason: string | undefined;
    let providerResult: Awaited<ReturnType<typeof callModel>> | undefined;

    try {
      if (model) {
        selectedModel = getModelById(model);
        if (!selectedModel) {
          return reply.code(400).send({ error: `Unknown model: ${model}` });
        }
      } else {
        const classification = await classifyTask(prompt);
        taskType = classification.taskType;
        classificationSource = classification.source;

        // Per-request header takes priority, then env var, then default to heuristic
        const strategyHeader = (req.headers['x-routing-strategy'] as string | undefined)?.trim();
        const useBandit =
          strategyHeader === 'bandit' ||
          (!strategyHeader && process.env.ROUTING_STRATEGY === 'bandit');

        const routingResult = useBandit
          ? await selectModelBandit(taskType, constraints)
          : selectModel(taskType, constraints);

        routingReason = routingResult.reason;
        selectedModel = getModelById(routingResult.modelId);

        if (!selectedModel) {
          throw new Error(`Selected model not found: ${routingResult.modelId}`);
        }
      }

      // Check Exact-Match Cache (only if model is known)
      if (selectedModel) {
        const exactCached = await getExactMatch(prompt, selectedModel.id);
        if (exactCached) {
          return {
            ...exactCached,
            classificationSource: classificationSource ?? null,
            cached: 'exact',
            costUsd: 0, // Cached responses are free
            latencyMs: 0
          };
        }
      }

      // Check Semantic Cache (only if no specific model requested, allows serving across models)
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

      providerResult = await callModel(selectedModel!.id, prompt);

      // Save to Caches
      setExactMatch(prompt, selectedModel!.id, providerResult).catch(e => req.log.error(e, 'Failed to save exact match cache'));
      if (!model) {
        saveSemanticCache(prompt, providerResult, selectedModel!.id).catch(e => req.log.error(e, 'Failed to save semantic cache'));
      }

      // Charge Budget
      if (userId && providerResult.costUsd > 0) {
        chargeBudget(userId, providerResult.costUsd).catch(e => req.log.error(e, 'Failed to charge budget'));
      }

      try {
        await logRequest({
          prompt,
          taskType: taskType ?? null,
          routingReason: routingReason ?? null,
          ...providerResult,
        });
      } catch (logErr) {
        req.log.warn(
          {
            err: getErrorDetails(logErr),
            requestBody: body,
            prompt,
            requestedModel: model,
            selectedModel: selectedModel?.id,
            taskType,
            routingReason,
            openRouterResponse: providerResult,
          },
          '[route] request logging failed; continuing without persistence'
        );
      }

      return {
        ...providerResult,
        classificationSource: classificationSource ?? null,
      };
    } catch (err) {
      if (err instanceof ConstraintUnsatisfiableError) {
        return reply.code(422).send({ error: err.message });
      }

      const errorDetails = getErrorDetails(err);
      req.log.error(
        {
          err: errorDetails,
          requestBody: body,
          prompt,
          requestedModel: model,
          selectedModel: selectedModel?.id,
          taskType,
          routingReason,
          openRouterResponse: providerResult,
        },
        '[route] /v1/route failed'
      );

      if (err instanceof Error) {
        return reply.code(500).send({ error: err.message });
      }

      throw err;
    }
  });
}