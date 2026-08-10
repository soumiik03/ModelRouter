import { getModelById } from '../models/registry.js';
export default async function routeStreamRoutes(app) {
    app.post('/v1/route/stream', async (req, reply) => {
        const { prompt, model } = req.body;
        const modelId = model ?? 'openai/gpt-oss-20b:free';
        const selectedModel = getModelById(modelId);
        if (!selectedModel) {
            return reply.code(400).send({ error: `Unknown model: ${modelId}` });
        }
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });
        try {
            const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true, // this is the key difference from your normal call
                }),
            });
            if (!upstreamRes.ok || !upstreamRes.body) {
                reply.raw.write(`data: ${JSON.stringify({ error: 'upstream failed' })}\n\n`);
                reply.raw.end();
                return;
            }
            const reader = upstreamRes.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                reply.raw.write(chunk);
            }
            reply.raw.end();
        }
        catch (err) {
            reply.raw.write(`data: ${JSON.stringify({ error: 'stream failed' })}\n\n`);
            reply.raw.end();
        }
    });
}
//# sourceMappingURL=routeStream.js.map