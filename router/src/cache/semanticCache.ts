import { pipeline } from '@huggingface/transformers';
import { Pool } from 'pg';

// 6.2 Semantic Cache
// Embeds incoming prompts and checks Postgres pgvector for semantically similar prompts.

let extractor: any = null;

// Initialize the embedding model lazily
async function getExtractor() {
  if (!extractor) {
    // using a small, fast local embedding model
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

/**
 * Embeds a prompt into a vector.
 */
async function embedPrompt(prompt: string): Promise<number[]> {
  const extract = await getExtractor();
  // Generate embeddings: pooling='mean', normalize=true
  const output = await extract(prompt, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Checks the semantic cache for a similar prompt.
 * Returns the cached response if similarity > threshold (e.g., 0.95).
 */
export async function checkSemanticCache(prompt: string, similarityThreshold = 0.95): Promise<any | null> {
  if (!pool) return null;

  try {
    const embedding = await embedPrompt(prompt);
    // Convert array to pgvector format '[0.1, 0.2, ...]'
    const vectorString = `[${embedding.join(',')}]`;

    // We use cosine distance (<=>). Similarity = 1 - distance.
    // So distance < (1 - threshold)
    const maxDistance = 1 - similarityThreshold;

    const { rows } = await pool.query(
      `
      SELECT response, model_used, (1 - (prompt_embedding <=> $1)) as similarity
      FROM semantic_cache
      WHERE prompt_embedding <=> $1 < $2
      ORDER BY prompt_embedding <=> $1 ASC
      LIMIT 1
      `,
      [vectorString, maxDistance]
    );

    if (rows.length > 0) {
      // Return the cached response. We parse it assuming response is stored as JSON string.
      return JSON.parse(rows[0].response);
    }
  } catch (err) {
    console.warn('Semantic cache read error:', err);
  }

  return null;
}

/**
 * Saves a prompt and response to the semantic cache.
 */
export async function saveSemanticCache(prompt: string, response: any, modelUsed: string): Promise<void> {
  if (!pool) return;

  try {
    const embedding = await embedPrompt(prompt);
    const vectorString = `[${embedding.join(',')}]`;

    await pool.query(
      `
      INSERT INTO semantic_cache (prompt, prompt_embedding, response, model_used)
      VALUES ($1, $2, $3, $4)
      `,
      [prompt, vectorString, JSON.stringify(response), modelUsed]
    );
  } catch (err) {
    console.warn('Semantic cache write error:', err);
  }
}
