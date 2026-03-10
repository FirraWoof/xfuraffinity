import { createServer } from 'node:http';
import { buildApp } from './app.js';
import { ensureCacheDir } from './cache.js';
import { loadConfig } from './config.js';
import { registry } from './metrics.js';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const config = loadConfig();
await ensureCacheDir(config.cacheDir);

const app = buildApp(config);
await app.listen({ port: config.port, host: '0.0.0.0' });

const metricsServer = createServer(async (_req, res) => {
  const body = await registry.metrics();
  res.writeHead(200, { 'Content-Type': registry.contentType });
  res.end(body);
});
metricsServer.listen(config.metricsPort, '0.0.0.0');
