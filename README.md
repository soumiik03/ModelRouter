# ModelRouter

ModelRouter is an explainable LLM routing gateway that classifies prompts, selects an appropriate model based on request signals and historical outcomes, executes requests through OpenRouter, and exposes standard-request telemetry through a live observability dashboard.

It is built to answer a specific question:

> When a request comes in, why did the system choose this model—and can that decision be inspected afterward?

ModelRouter currently uses transparent heuristics, optional LLM-based classification, and an epsilon-greedy bandit policy. It is not a fully learned neural routing system.

## Links

- [Live Dashboard](https://modelrouter-dashboard.onrender.com/dashboard)
- [API Health Check](https://modelrouter-api-m8gg.onrender.com/health)
- [Repository](https://github.com/soumiik03/ModelRouter)

## Screenshots

<img width="1917" height="875" alt="13" src="https://github.com/user-attachments/assets/b557e2f6-4dd7-4622-bee3-c7db3dc19285" />
<img width="1901" height="870" alt="12" src="https://github.com/user-attachments/assets/0ed86bd8-ca69-433e-808c-c312654da9e5" />
<img width="1918" height="882" alt="11" src="https://github.com/user-attachments/assets/97b9637d-2015-491d-8b24-a18b8179e88e" />


## Table of Contents

- [Highlights](#highlights)
- [Dashboard](#dashboard)
- [Architecture](#architecture)
- [What It Does](#what-it-does)
- [Features](#features)
- [API Reference](#api-reference)
- [Evaluation Results](#evaluation-results)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running Evaluations](#running-evaluations)
- [Repository Structure](#repository-structure)
- [Validation](#validation)
- [Limitations and Roadmap](#limitations-and-roadmap)
- [Project Status](#project-status)
- [License](#license)
- [Author](#author)

## Highlights

- Full standard-request routing pipeline deployed with a Fastify Router and a Next.js observability dashboard.
- Two inspectable routing strategies: deterministic heuristics and an epsilon-greedy bandit.
- Hybrid classification using keyword heuristics with an LLM-based fallback when the heuristic classifier lacks confidence.
- Exact-match caching through Upstash Redis with an in-memory fallback.
- Semantic caching using `Xenova/all-MiniLM-L6-v2` embeddings and PostgreSQL/pgvector.
- Retry handling and same-quality-tier fallback when provider execution fails.
- Per-user budget checks backed by PostgreSQL.
- Routing metadata including classification source, prompt signals, routing reason, cache status, and fallback status.
- A checked-in 60-task evaluation snapshot comparing four routing strategies.
- Streaming support through Server-Sent Events.

The standard request pipeline records routing decisions and runtime telemetry. The streaming endpoint currently uses a separate, more limited execution path and does not yet share the complete standard pipeline.

## Dashboard

The live dashboard provides views for:

- Overview
- Routing
- Models
- Requests
- Cache
- Budgets
- Evaluations
- Service status

It exposes standard-request information such as:

- Request counts
- Success and failure rates
- Latency
- Selected model
- Classification source
- Routing strategy
- Routing reason
- Prompt signals
- Retry and fallback status
- Cache behavior
- Budget utilization
- Recent routing activity

Open the dashboard:

[modelrouter-dashboard.onrender.com/dashboard](https://modelrouter-dashboard.onrender.com/dashboard)

## Architecture

```text
Client
  │
  │ POST /v1/route
  │ POST /v1/route/stream
  ▼
Fastify Router
  │
  ├── Request validation
  ├── Task classification
  ├── Prompt signal analysis
  ├── Routing strategy
  ├── Model selection
  ├── Exact-match cache
  ├── Semantic cache
  ├── Provider execution
  ├── Retry and same-tier fallback
  └── Telemetry recording
        │
        ├── PostgreSQL / pgvector
        └── Upstash Redis
                │
                ▼
       Next.js Observability Dashboard
```

## What It Does

Different models trade off capability, latency, cost, availability, and context-window size differently.

A one-line bug fix and a multi-step refactoring request may both be classified as coding tasks, but they may not require the same model.

ModelRouter acts as a centralized decision layer. It uses request-level signals and historical outcomes to make model selection inspectable and measurable instead of hiding the decision inside individual applications or provider calls.

## Features

### Task Classification

ModelRouter currently supports five task categories:

- `code`
- `reasoning`
- `creative`
- `extraction`
- `chat`

Classification first uses keyword-based heuristics. When the heuristic classifier cannot confidently determine the task type, the Router can use an LLM-based classification fallback through OpenRouter.

The classification source is recorded per request:

```json
{
  "classificationSource": "heuristic"
}
```

### Prompt Signal Analysis

The Router analyzes the following signals before selecting a model:

| Signal | Description |
|---|---|
| Prompt length | Raw character count |
| Estimated tokens | Approximate input size |
| Complexity score | Heuristic score based on prompt length, structure, and selected keywords |
| Multi-step detection | Detects numbered or sequential instructions |

Prompts with a complexity score above `0.5` or an estimated size above `300` tokens are escalated to the strongest eligible model.

This is an explainable heuristic layer. It is intentionally not presented as a learned prompt-difficulty model.

### Routing Strategies

#### Heuristic Routing

Heuristic routing is the default strategy.

It uses:

- Task type
- Prompt length
- Estimated token count
- Complexity score
- Multi-step detection
- Configured model tiers
- Supported request constraints

It also acts as the safe fallback when the bandit strategy does not have enough historical data.

#### Epsilon-Greedy Bandit

The epsilon-greedy bandit uses historical routing outcomes to balance exploration and exploitation.

Current configuration:

```text
epsilon = 0.1
minimum quality-scored samples = 5
```

The exploitation score is:

```text
model score =
average quality score - (average cost in USD × 100)
```

Because the current OpenRouter adapter reports `costUsd = 0` for registered models, the current score is effectively driven by average quality.

With probability `0.1`, the Router explores a random eligible model. Otherwise, it selects the model with the highest historical score for the relevant task type.

Enable the bandit globally:

```env
ROUTING_STRATEGY=bandit
```

Or enable it for an individual request:

```http
x-routing-strategy: bandit
```

### Retry and Fallback Handling

ModelRouter supports retries for recoverable provider failures and same-quality-tier fallback execution when the selected model fails.

Fallback behavior is recorded explicitly:

```json
{
  "wasFallback": false
}
```

This makes reliability behavior visible in the dashboard instead of hiding it inside provider integration code.

### Exact-Match Cache

Identical prompts can be served through an exact-match cache backed by Upstash Redis.

The exact cache currently includes:

- Upstash Redis storage
- An in-memory fallback when Redis is unavailable
- A one-hour TTL

A cached response may include:

```json
{
  "cached": "exact"
}
```

### Semantic Cache

ModelRouter also supports semantic caching using:

- `Xenova/all-MiniLM-L6-v2` embeddings
- PostgreSQL
- pgvector

The semantic cache can match similar previous prompts instead of requiring an identical prompt.

### Budget Guardrails

Per-user budget checks are implemented when PostgreSQL is configured.

Requests can include a `userId`, and budget-related usage information is exposed through the dashboard.

Production cost accounting is currently pending. Since registered models currently report zero provider cost, budget and cost data should not yet be treated as authoritative billing information.

## API Reference

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

### Standard Routing

```http
POST /v1/route
Content-Type: application/json
```

Example request:

```json
{
  "prompt": "Explain the difference between TCP and UDP in one sentence.",
  "constraints": {
    "minQuality": 3
  },
  "userId": "demo-user"
}
```

Optional request fields:

- `model`
- `constraints.maxCostUsd`
- `constraints.maxLatencyMs`
- `constraints.minQuality`
- `userId`

`maxLatencyMs` is currently accepted but is not yet enforced during model selection.

Example response:

```json
{
  "text": "TCP is connection-oriented, while UDP is connectionless.",
  "modelUsed": "openai/gpt-oss-20b:free",
  "tokensIn": 16,
  "tokensOut": 42,
  "costUsd": 0,
  "latencyMs": 1234,
  "wasFallback": false,
  "classificationSource": "heuristic",
  "promptSignals": {
    "promptLength": 62,
    "estimatedTokens": 16,
    "complexityScore": 0,
    "isLikelyMultiStep": false
  }
}
```

Actual response text, model, latency, token usage, and routing signals depend on the request and provider response.

The current provider adapter reports `costUsd = 0` for registered models. This value should not be interpreted as complete production billing data.

Example with cURL:

```bash
curl -X POST \
  "https://modelrouter-api-m8gg.onrender.com/v1/route" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain the difference between TCP and UDP in one sentence."
  }'
```

The deployed Router uses its server-side provider credential. Clients do not need to send an OpenRouter authorization header.

### Streaming

```http
POST /v1/route/stream
Content-Type: application/json
Accept: text/event-stream
```

Example request:

```json
{
  "prompt": "Count from 1 to 10."
}
```

Example with cURL:

```bash
curl -N -X POST \
  "http://localhost:3000/v1/route/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Count from 1 to 10."
  }'
```

The streaming route proxies OpenRouter SSE output.

If no model is specified, it currently defaults to:

```text
openai/gpt-oss-20b:free
```

The streaming route currently does not perform:

- Standard request classification
- Exact or semantic cache lookup
- Budget charging
- Database telemetry logging
- Standard routing-strategy selection

These capabilities are planned for a future unified streaming pipeline.

### Error Responses

| Status | Condition | Example |
|---:|---|---|
| `400` | Missing prompt or unknown model | `{ "error": "Missing prompt" }` |
| `422` | No model satisfies the constraints | `{ "error": "No model in the pool satisfies the given constraints: ..." }` |
| `429` | User budget exceeded | `{ "error": "User demo-user has exceeded their budget ..." }` |
| `500` | Provider or unexpected execution failure | `{ "error": "OPENROUTER_API_KEY is not configured" }` |

The streaming route returns `400` for an unknown model.

After an SSE response has started, upstream failures are emitted as events, for example:

```text
data: {"error":"upstream failed"}
```

### Observability Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /v1/analytics` | Runtime metrics, recent logs, and benchmark summary |
| `GET /v1/evals` | Stored 60-task evaluation results |
| `GET /v1/cache/stats` | Cache providers and status |
| `GET /v1/budgets` | User budget and utilization data |

## Evaluation Results

The repository includes an evaluation pipeline for four routing strategies over a 60-task dataset:

- `always-cheap`
- `always-expensive`
- `heuristic-router`
- `learned-bandit`

The pipeline supports:

- Exact-match scoring
- Keyword-overlap scoring
- Code unit-test scoring
- Manual-rubric records
- Latency measurement
- Success-rate measurement
- Cost fields where provider usage data is available

The checked-in snapshot is located at:

```text
evals/results/summary.json
```

### Evaluation Snapshot

| Strategy | Quality | Average latency | Cost | Success rate |
|---|---:|---:|---:|---:|
| Always cheap | 0.55 | 44,275 ms | $0.00 | 56/60 (93.3%) |
| Always expensive | 0.46 | 28,821 ms | $0.00 | 59/60 (98.3%) |
| Heuristic router | 0.53 | 19,682 ms | $0.00 | 60/60 (100%) |
| Epsilon-greedy bandit | 0.53 | 1,629 ms | $0.00 | 60/60 (100%) |

The heuristic run used its keyword classifier for 55% of requests and the LLM classification fallback for 45% of requests.

### Evaluation Notes

This is one project snapshot, not a statistically conclusive benchmark.

Results depend on:

- Live provider behavior
- Model availability
- Network latency
- Provider throttling
- Cache state
- Model configuration
- Historical bandit data
- Evaluation scoring behavior

All currently registered models report zero provider cost, so cost comparisons are not meaningful until paid-model pricing and production usage accounting are implemented.

The bandit result may also benefit from previously accumulated routing history. Cache state, request ordering, provider conditions, and routing history were not fully isolated in this snapshot. Future evaluations should control these variables more rigorously.

## Local Development

### Prerequisites

- Node.js 18+
- npm
- An OpenRouter API key
- PostgreSQL with pgvector
- Optional Upstash Redis credentials

### Clone the Repository

```bash
git clone https://github.com/soumik03/ModelRouter.git
cd ModelRouter
```

### Run the Router

```bash
cd router
npm install
npm run dev
```

The API defaults to:

```text
http://localhost:3000
```

### Run the Dashboard

In another terminal:

```bash
cd dashboard
npm install
npm run dev
```

The dashboard defaults to:

```text
http://localhost:3001
```

### Production Build

```bash
cd router
npm run build
npm start
```

In another terminal:

```bash
cd dashboard
npm run build
npm start
```

## Environment Variables

### Router

```env
OPENROUTER_API_KEY=your_openrouter_key
DATABASE_URL=your_postgres_connection_string
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
PORT=3000
ROUTING_STRATEGY=heuristic
```

### Dashboard

```env
ROUTER_API_URL=http://localhost:3000
```

### Evaluation

```env
EVAL_BASE_URL=http://localhost:3000
EVAL_DATASET=full
```

Never commit credentials or expose `OPENROUTER_API_KEY` to the browser.

## Running Evaluations

Start the Router first, then run the evaluation commands from the `router` directory:

```bash
npm run eval
npm run report
```

Run a smaller dataset:

```bash
EVAL_DATASET=sample npm run eval
```

Run a subset of tasks:

```bash
EVAL_START=0 EVAL_END=10 npm run eval
```

## Repository Structure

```text
ModelRouter/
├── router/
│   ├── src/
│   │   ├── routes/          # API, streaming, and analytics
│   │   ├── routing/         # Classifiers, signals, heuristic, and bandit
│   │   ├── providers/       # OpenRouter integration
│   │   ├── cache/           # Exact and semantic caches
│   │   ├── budget/          # Budget tracking and guardrails
│   │   └── db/              # Schema and request logging
│   ├── package.json
│   └── .env.example
│
├── dashboard/               # Next.js observability dashboard
├── evals/                   # Datasets, scorers, and reports
├── README.md
└── LICENSE                  # Not yet declared
```

## Validation

The current project has been checked through:

- TypeScript compilation
- ESLint
- Production builds
- Production startup
- Health-check requests
- Standard routing requests
- Streaming requests
- Dashboard-to-Router communication
- Redis connectivity
- PostgreSQL connectivity
- Standard-request telemetry recording
- Dashboard event visibility
- Checked-in evaluation snapshot

## Limitations and Roadmap

ModelRouter is actively developed and is not yet a fully hardened public production gateway.

Known limitations include:

- Provider cost accounting currently reports zero for registered models.
- `maxLatencyMs` is accepted but not enforced during model selection.
- Model metadata and quality tiers are manually configured.
- The public API has no authentication.
- The public API has no rate limiting.
- Prompt and response data may be persisted.
- Production deployments need retention, redaction, and access-control policies.
- The streaming route currently bypasses standard routing telemetry, caching, and budget logic.
- The bandit strategy needs sufficient historical data before it can make useful decisions.
- Provider health is not yet a first-class routing signal.
- Render cold starts can affect observed latency.
- Dashboard screenshots and a demo video are not currently committed.
- No license has been declared.

Planned improvements include:

- Authentication and client API keys
- Rate limiting and abuse protection
- Production-grade cost accounting
- Unified streaming telemetry
- Streaming cache and budget integration
- Provider health scoring
- Latency-aware routing
- Cost-aware routing
- Stronger quality evaluation
- Improved contextual bandit policies
- Distributed tracing
- Alerts and historical analytics
- Prompt and response redaction
- Better model capability metadata

Do not use the public deployment for sensitive or high-volume workloads until authentication, rate limiting, data-retention controls, and production cost accounting are implemented.

## Project Status

| Area | Status |
|---|---|
| Router API | Implemented and deployed |
| Heuristic classification | Implemented |
| LLM classification fallback | Implemented |
| Heuristic model selection | Implemented |
| Epsilon-greedy bandit | Implemented |
| Retry handling | Implemented |
| Same-tier fallback | Implemented |
| Exact-match cache | Implemented |
| Semantic cache | Implemented with PostgreSQL/pgvector |
| Budget guardrails | Implemented with PostgreSQL |
| Standard request telemetry | Implemented |
| Streaming endpoint | Implemented |
| Dashboard | Implemented and deployed |
| Evaluation pipeline | Implemented |
| Evaluation snapshot | Checked in |
| Production cost accounting | Pending |
| Authentication | Not implemented |
| Rate limiting | Not implemented |
| Unified streaming telemetry | Pending |

## License

No license has been declared yet.

Until a license is added, no permission is granted to reuse, modify, or redistribute this code beyond what copyright law permits. Add a license file before accepting external contributions or distributing ModelRouter for reuse.

## Author

**Soumik Talukder**

- [GitHub](https://github.com/soumiik03)
- [LinkedIn](https://linkedin.com/in/soumiktalukder)

ModelRouter explores explainable LLM routing, provider abstraction, streaming infrastructure, caching, fallback execution, runtime observability, and model-selection evaluation.
