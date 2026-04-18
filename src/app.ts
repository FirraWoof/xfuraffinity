import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { getCached, setCached } from './cache.js';
import type { Config } from './config.js';
import { generateMessageEmbed } from './embedGenerator/messageEmbed.js';
import { fetchSubmissionInfo } from './furaffinity/client.js';
import { noticeError, recordSubmissionEvent } from './metrics.js';
import { handleSubmission } from './submissionHandler.js';

export function buildApp(config: Config): FastifyInstance {
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

    const event = {
      submissionId: id,
      url: req.url,
      requester: result.meta.requester,
      country,
      cached: result.meta.cached ?? false,
      submissionResult: result.meta.submissionResult ?? 'unknown',
      durationMs: Date.now() - start,
    };

    recordSubmissionEvent(event);

    if (result.meta.error) {
      noticeError(result.meta.error);
      app.log.error({ ...event, err: result.meta.error }, 'request');
    } else if (result.meta.submissionResult === 'unauthenticated' || result.meta.submissionResult === 'blocked') {
      app.log.error(event, 'request');
    } else if (result.meta.submissionResult === 'serverError') {
      app.log.warn(event, 'request');
    } else {
      app.log.info(event, 'request');
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

  app.get('/oembed', async (request, reply) => {
    const { id: idStr } = request.query as { id?: string };
    const id = parseInt(idStr ?? '', 10);

    if (isNaN(id)) {
      reply.status(400).send({ error: 'Missing or invalid id parameter' });
      return;
    }

    const cached = await getCached(config.cacheDir, id);
    const result = cached ?? await fetchSubmissionInfo(id, { a: config.sessionA, b: config.sessionB });
    if (!cached) await setCached(config.cacheDir, id, result);

    if (result.type !== 'image' && result.type !== 'story' && result.type !== 'music') {
      reply.status(404).send({ error: 'Submission not found or not embeddable' });
      return;
    }

    reply
      .type('application/json+oembed')
      .send({
        version: '1.0',
        type: result.type === 'image' ? 'photo' : 'link',
        author_name: result.info.artistName,
        author_url: result.info.artistUrl,
        provider_name: 'FurAffinity',
        provider_url: 'https://www.furaffinity.net',
      });
  });

  return app;
}
