CREATE TABLE "semantic_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"prompt_embedding" vector(384) NOT NULL,
	"response" text NOT NULL,
	"model_used" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "user_budgets" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"budget_usd" real NOT NULL,
	"spent_usd" real DEFAULT 0 NOT NULL
);
