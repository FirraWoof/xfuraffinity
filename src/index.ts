import { buildApp } from './app.js';
import { ensureCacheDir } from './cache.js';
import { loadConfig } from './config.js';

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
