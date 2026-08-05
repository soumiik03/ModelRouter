CREATE TABLE "request_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"model_used" text NOT NULL,
	"cost_usd" real NOT NULL,
	"latency_ms" integer NOT NULL,
	"tokens_in" integer NOT NULL,
	"tokens_out" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"was_fallback" boolean DEFAULT false,
	"fallback_from_model" text,
	"task_type" text,
	"routing_reason" text,
	"quality_score" real
);
