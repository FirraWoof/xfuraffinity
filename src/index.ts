import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ensureCacheDir } from './cache.js';
import { loadConfig } from './config.js';
import { generateMessageEmbed } from './embedGenerator/messageEmbed.js';
import { handleSubmission } from './submissionHandler.js';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const config = loadConfig();
await ensureCacheDir(config.cacheDir);

const app = Fastify({ logger: true });

app.setErrorHandler((error, _req, reply) => {
  app.log.error(error);
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
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    reply
      .type('text/html; charset=utf-8')
      .send(generateMessageEmbed('User Error', 'Please use a valid submission URL to generate an embed.'));
    return;
  }

  const userAgent = req.headers['user-agent'] ?? '';
  const result = await handleSubmission(id, userAgent, config);

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
