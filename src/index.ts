import { createServer } from 'node:http';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ensureCacheDir } from './cache.js';
import { loadConfig } from './config.js';
import { generateMessageEmbed } from './embedGenerator/messageEmbed.js';
import { registry, requestsTotal } from './metrics.js';
import { handleSubmission } from './submissionHandler.js';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const config = loadConfig();
await ensureCacheDir(config.cacheDir);

const app = Fastify({
  logger: { formatters: { level: (label) => ({ level: label }) } },
  disableRequestLogging: true,
});

app.setErrorHandler((error, _req, reply) => {
  app.log.error({ err: error }, 'unhandled fastify error');
  reply
    .type('text/html; charset=utf-8')
    .send(generateMessageEmbed('Error', 'An unexpected error occurred. Please report this at github.com/FirraWoof/xfuraffinity'));
});

app.get('/', (_req, reply) => {
  reply.redirect('https://firrawoof.github.io/xfuraffinity/');
});

async function handleRoute(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const start = Date.now();
  const id = parseInt(req.params.id, 10);
  const country = (req.headers['cf-ipcountry'] as string | undefined) ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? '';

  if (isNaN(id)) {
    app.log.warn({ url: req.url, country, userAgent }, 'invalid submission id');
    reply
      .type('text/html; charset=utf-8')
      .send(generateMessageEmbed('User Error', 'Please use a valid submission URL to generate an embed.'));
    return;
  }

  const result = await handleSubmission(id, userAgent, config);

  requestsTotal.inc({ requester: result.meta.requester, country });

  const logContext = {
    submissionId: id,
    url: req.url,
    requester: result.meta.requester,
    country,
    cached: result.meta.cached,
    submissionResult: result.meta.submissionResult,
    durationMs: Date.now() - start,
  };

  if (result.meta.error) {
    app.log.error({ ...logContext, err: result.meta.error }, 'request');
  } else if (result.meta.submissionResult === 'unauthenticated' || result.meta.submissionResult === 'blocked') {
    app.log.error(logContext, 'request');
  } else if (result.meta.submissionResult === 'serverError') {
    app.log.warn(logContext, 'request');
  } else {
    app.log.info(logContext, 'request');
  }

  if (result.type === 'redirect') {
    reply.redirect(result.url);
  } else {
    reply.type('text/html; charset=utf-8').send(result.html);
  }
}

app.get('/view/:id', handleRoute);
app.get('/view/:id/', handleRoute);
app.get('/full/:id', handleRoute);
app.get('/full/:id/', handleRoute);

await app.listen({ port: config.port, host: '0.0.0.0' });

const metricsServer = createServer(async (_req, res) => {
  const body = await registry.metrics();
  res.writeHead(200, { 'Content-Type': registry.contentType });
  res.end(body);
});
metricsServer.listen(config.metricsPort, '0.0.0.0');
