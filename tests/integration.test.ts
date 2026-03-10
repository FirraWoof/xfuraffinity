import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type FastifyInstance } from 'fastify';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { ensureCacheDir } from '../src/cache.js';

const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url));
const fixture = (name: string) => readFileSync(join(fixturesDir, name), 'utf-8');

const imageHtml = fixture('image.html');
const gifHtml = fixture('gif.html');
const largeImageHtml = fixture('large-image.html');
const storyHtml = fixture('story.html');
const musicHtml = fixture('music.html');
const flashHtml = fixture('flash.html');
const notFoundHtml = fixture('not-found.html');
const unauthenticatedHtml = fixture('unauthenticated.html');
const blockedHtml = fixture('blocked.html');

const DISCORD_UA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';
const TELEGRAM_UA = 'TelegramBot (like TwitterBot)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Default MSW handlers covering all fixture IDs
const defaultHandlers = [
  // FA page requests
  http.get('https://www.furaffinity.net/view/123', () => HttpResponse.text(imageHtml)),
  http.get('https://www.furaffinity.net/view/124', () => HttpResponse.text(gifHtml)),
  http.get('https://www.furaffinity.net/view/125', () => HttpResponse.text(largeImageHtml)),
  http.get('https://www.furaffinity.net/view/126', () => HttpResponse.text(storyHtml)),
  http.get('https://www.furaffinity.net/view/127', () => HttpResponse.text(musicHtml)),
  http.get('https://www.furaffinity.net/view/128', () => HttpResponse.text(flashHtml)),
  http.get('https://www.furaffinity.net/view/129', () => HttpResponse.text(notFoundHtml)),
  http.get('https://www.furaffinity.net/view/130', () => HttpResponse.text(unauthenticatedHtml)),
  http.get('https://www.furaffinity.net/view/131', () => HttpResponse.text(blockedHtml)),
  http.get('https://www.furaffinity.net/view/132', () => new HttpResponse(null, { status: 500 })),

  // Asset HEAD requests for images
  http.head('https://d.furaffinity.net/art/testartist/123/test.jpg', () =>
    new HttpResponse(null, { headers: { 'content-length': '1048576', 'content-type': 'image/jpeg' } })
  ),
  http.head('https://d.furaffinity.net/art/testartist/124/test.gif', () =>
    new HttpResponse(null, { headers: { 'content-length': '1048576', 'content-type': 'image/gif' } })
  ),
  http.head('https://d.furaffinity.net/art/testartist/125/large.jpg', () =>
    new HttpResponse(null, { headers: { 'content-length': '6291456', 'content-type': 'image/jpeg' } })
  ),

  // Story text fetch
  http.get('https://d.furaffinity.net/art/testartist/126/story.txt', () =>
    HttpResponse.text('Once upon a time in a land far away there lived a brave adventurer.')
  ),

  // Audio HEAD request
  http.head('https://d.furaffinity.net/art/testartist/127/song.mp3', () =>
    new HttpResponse(null, { headers: { 'content-length': '5000000', 'content-type': 'audio/mpeg' } })
  ),
];

const server = setupServer(...defaultHandlers);

let app: FastifyInstance;
let cacheDir: string;

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' });

  cacheDir = await mkdtemp(join(tmpdir(), 'xfuraffinity-test-'));
  await ensureCacheDir(cacheDir);
  app = buildApp({
    sessionA: 'test-a',
    sessionB: 'test-b',
    port: 0,
    metricsPort: 0,
    cacheDir,
    publicUrl: 'https://example.com',
  });
  await app.ready();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(async () => {
  server.close();
  await app.close();
  await rm(cacheDir, { recursive: true });
});

describe('routing', () => {
  it('redirects humans to FurAffinity', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123', headers: { 'user-agent': BROWSER_UA } });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('https://www.furaffinity.net/view/123');
  });

  it('handles /full/:id route', async () => {
    const response = await app.inject({ method: 'GET', url: '/full/123', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Test Image');
  });

  it('handles trailing slash variants', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123/', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Test Image');
  });

  it('returns error for non-numeric id', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/abc', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('User Error');
  });

  it('redirects GET / to docs', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('firrawoof.github.io');
  });
});

describe('image embeds', () => {
  it('generates image embed for bot', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('og:image');
    expect(body).toContain('https://d.furaffinity.net/art/testartist/123/test.jpg');
    expect(body).toContain('twitter:card');
    expect(body).toContain('summary_large_image');
    expect(body).toContain('Test Image');
  });

  it('includes view/comment/fave stats in description', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123', headers: { 'user-agent': DISCORD_UA } });
    const body = response.body;
    // Stats formatted as 1,234 (Intl.NumberFormat)
    expect(body).toContain('1,234');
    expect(body).toContain('56');
    expect(body).toContain('789');
  });

  it('generates GIF embed with og:image for non-Telegram bots', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/124', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('og:image');
    expect(body).toContain('https://d.furaffinity.net/art/testartist/124/test.gif');
    expect(body).not.toContain('og:video');
  });

  it('includes oEmbed link tag pointing to /oembed?id=', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123', headers: { 'user-agent': DISCORD_UA } });
    const body = response.body;
    expect(body).toContain('application/json+oembed');
    expect(body).toContain('https://example.com/oembed?id=123');
  });
});

describe('telegram image embeds', () => {
  it('uses og:image with full URL and no oEmbed for regular image', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Image');
    expect(body).toContain('og:image');
    expect(body).toContain('https://d.furaffinity.net/art/testartist/123/test.jpg');
    expect(body).not.toContain('application/json+oembed');
  });

  it('falls back to thumbnail when image is >5MB', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/125', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    // Should use thumbnail URL, not the full image URL
    expect(body).toContain('t.furaffinity.net/125@400-thumb.jpg');
    expect(body).not.toContain('d.furaffinity.net/art/testartist/125/large.jpg');
  });

  it('uses video/mp4 for GIF on Telegram', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/124', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('og:video');
    expect(body).toContain('video/mp4');
    expect(body).not.toContain('og:image');
  });
});

describe('story embeds', () => {
  it('generates story embed with excerpt in description', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/126', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Story');
    expect(body).toContain('📄 Story');
    expect(body).toContain('Once upon a time');
  });
});

describe('music embeds', () => {
  it('generates standard music embed with og:audio', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/127', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Music');
    expect(body).toContain('og:audio');
    expect(body).toContain('d.furaffinity.net/art/testartist/127/song.mp3');
    expect(body).toContain('audio/mpeg');
  });

  it('generates Telegram music embed without og:audio', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/127', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Music');
    expect(body).not.toContain('og:audio');
  });
});

describe('error states', () => {
  it('returns Not Found for missing submission', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/129', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Not Found');
  });

  it('returns Unsupported for flash submission', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/128', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Unsupported Submission');
  });

  it('returns Session Expired for unauthenticated', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/130', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Session Expired');
  });

  it('returns Blocked for Cloudflare-blocked page', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/131', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Blocked by FurAffinity');
  });

  it('returns FA Down when FA returns 500', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/132', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('FA Down');
  });
});

describe('cache', () => {
  it('serves cached result on second request without re-fetching FA', async () => {
    let fetchCount = 0;
    server.use(
      http.get('https://www.furaffinity.net/view/999', () => {
        fetchCount++;
        return HttpResponse.text(imageHtml.replace('view/123/', 'view/999/').replace('Test Image', 'Cached Image'));
      }),
      http.head('https://d.furaffinity.net/art/testartist/123/test.jpg', () =>
        new HttpResponse(null, { headers: { 'content-length': '1048576', 'content-type': 'image/jpeg' } })
      )
    );

    await app.inject({ method: 'GET', url: '/view/999', headers: { 'user-agent': DISCORD_UA } });
    expect(fetchCount).toBe(1);

    // Second request — MSW would still serve it (fetchCount would go to 2)
    // but the result should come from cache (which doesn't re-invoke the handler since fetch is intercepted)
    // Instead verify the result is served correctly on second call
    const secondResponse = await app.inject({ method: 'GET', url: '/view/999', headers: { 'user-agent': DISCORD_UA } });
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toContain('Cached Image');
    // fetchCount should still be 1 since cache was populated
    expect(fetchCount).toBe(1);
  });
});

describe('/oembed', () => {
  it('returns oEmbed JSON for image submission', async () => {
    const response = await app.inject({ method: 'GET', url: '/oembed?id=123' });
    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json.version).toBe('1.0');
    expect(json.type).toBe('photo');
    expect(json.author_name).toBe('TestArtist');
    expect(json.provider_name).toBe('FurAffinity');
  });

  it('returns 404 for non-embeddable type (flash)', async () => {
    const response = await app.inject({ method: 'GET', url: '/oembed?id=128' });
    expect(response.statusCode).toBe(404);
  });

  it('returns 400 for missing id', async () => {
    const response = await app.inject({ method: 'GET', url: '/oembed' });
    expect(response.statusCode).toBe(400);
  });
});
