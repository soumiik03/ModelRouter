import { pipeline } from '@huggingface/transformers';
import { Pool } from 'pg';
let extractor = null;
async function getExtractor() {
    if (!extractor) {
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return extractor;
}
const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : null;
async function embedPrompt(prompt) {
    const extract = await getExtractor();
    const output = await extract(prompt, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}
export async function checkSemanticCache(prompt, similarityThreshold = 0.95) {
    if (!pool)
        return null;
    try {
        const embedding = await embedPrompt(prompt);
        const vectorString = `[${embedding.join(',')}]`;
        const maxDistance = 1 - similarityThreshold;
        const { rows } = await pool.query(`
      SELECT response, model_used, (1 - (prompt_embedding <=> $1)) as similarity
      FROM semantic_cache
      WHERE prompt_embedding <=> $1 < $2
      ORDER BY prompt_embedding <=> $1 ASC
      LIMIT 1
      `, [vectorString, maxDistance]);
        if (rows.length > 0) {
            return JSON.parse(rows[0].response);
        }
    }
    catch (err) {
        console.warn('Semantic cache read error:', err);
    }
    return null;
}
export async function saveSemanticCache(prompt, response, modelUsed) {
    if (!pool)
        return;
    try {
        const embedding = await embedPrompt(prompt);
        const vectorString = `[${embedding.join(',')}]`;
        await pool.query(`
      INSERT INTO semantic_cache (prompt, prompt_embedding, response, model_used)
      VALUES ($1, $2, $3, $4)
      `, [prompt, vectorString, JSON.stringify(response), modelUsed]);
    }
    catch (err) {
        console.warn('Semantic cache write error:', err);
    }
}
//# sourceMappingURL=semanticCache.js.map