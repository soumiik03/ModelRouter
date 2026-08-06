import 'dotenv/config';
import Fastify from 'fastify';
import routeRoutes from './routes/route.js';
import routeStreamRoutes from './routes/routeStream.js';
import cors from '@fastify/cors';
const app = Fastify({ logger: true });
await app.register(cors, { origin: '*' });

app.register(routeRoutes);

const port = Number(process.env.PORT) || 3000;
const apiKeyLength = process.env.OPENROUTER_API_KEY?.trim().length ?? 0;

console.info(`[startup] using port ${port}`);
if (apiKeyLength > 0) {
  console.info(`[startup] OPENROUTER_API_KEY loaded (length=${apiKeyLength})`);
} else {
  console.warn('[startup] OPENROUTER_API_KEY is missing or empty; requests will fail until it is configured.');
}
app.register(routeStreamRoutes);

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) throw err;
});
