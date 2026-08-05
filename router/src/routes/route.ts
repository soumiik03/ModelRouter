import type { FastifyInstance } from 'fastify';
import { callModel } from '../providers/openrouter.js';
import { getModelById } from '../models/registry.js';
import { logRequest } from '../db/logRequest.js';
import { classifyTask } from '../routing/classify.js';
import type { TaskType, ClassificationSource } from '../routing/classify.js';
import { ConstraintUnsatisfiableError, selectModel } from '../routing/heuristicRouter.js';

interface RouteRequestBody {
  prompt: string;
  model?: string;
  constraints?: {
    maxCostUsd?: number;
    maxLatencyMs?: number;
    minQuality?: number;
  };
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
    const { prompt, model, constraints } = body;

    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return reply.code(400).send({ error: 'Missing prompt' });
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
        const routingResult = selectModel(taskType, constraints);
        routingReason = routingResult.reason;
        selectedModel = getModelById(routingResult.modelId);

        if (!selectedModel) {
          throw new Error(`Selected model not found: ${routingResult.modelId}`);
        }
      }

      providerResult = await callModel(selectedModel.id, prompt);

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