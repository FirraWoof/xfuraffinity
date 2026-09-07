import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { HttpResponse, http } from 'msw';
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
const loginRequiredHtml = fixture('login-required.html');
const imageNewLayoutHtml = fixture('image-new-layout.html');
const storyNewLayoutHtml = fixture('story-new-layout.html');
const musicNewLayoutHtml = fixture('music-new-layout.html');
const imageEmptyDescHtml = fixture('image-empty-desc.html');
const imageNoContentLengthHtml = fixture('image-no-content-length.html');
const accountDisabledHtml = fixture('account-disabled.html');
const blockedHtml = fixture('blocked.html');
const offlineHtml = fixture('offline.html');
const imageBbcodeDescHtml = fixture('image-bbcode-desc.html');
const imageRichDescHtml = fixture('image-rich-desc.html');

const DISCORD_UA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';
const TELEGRAM_UA = 'TelegramBot (like TwitterBot)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function jpegHeader(width: number, height: number): Buffer {
  const buf = Buffer.alloc(11);
  buf.writeUInt16BE(0xffd8, 0);
  buf.writeUInt16BE(0xffc0, 2);
  buf.writeUInt16BE(0x0011, 4);
  buf.writeUInt8(0x08, 6);
  buf.writeUInt16BE(height, 7);
  buf.writeUInt16BE(width, 9);
  return buf;
}

function gifHeader(width: number, height: number): Buffer {
  const buf = Buffer.alloc(10);
  buf.write('GIF89a', 0, 'ascii');
  buf.writeUInt16LE(width, 6);
  buf.writeUInt16LE(height, 8);
  return buf;
}

function imageResponse(contentType: string, totalBytes: number | null, body: Buffer) {
  const headers: Record<string, string> = { 'content-type': contentType };
  if (totalBytes !== null) headers['content-range'] = `bytes 0-${body.length - 1}/${totalBytes}`;
  return new HttpResponse(new Uint8Array(body), { status: 206, headers });
}

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
  http.get('https://www.furaffinity.net/view/133', () => HttpResponse.text(loginRequiredHtml)),
  http.get('https://www.furaffinity.net/view/134', () => HttpResponse.text(imageNewLayoutHtml)),
  http.get('https://www.furaffinity.net/view/135', () => HttpResponse.text(storyNewLayoutHtml)),
  http.get('https://www.furaffinity.net/view/136', () => HttpResponse.text(musicNewLayoutHtml)),
  http.get('https://www.furaffinity.net/view/137', () => HttpResponse.text(imageNoContentLengthHtml)),
  http.get('https://www.furaffinity.net/view/138', () => HttpResponse.text(imageEmptyDescHtml)),
  http.get('https://www.furaffinity.net/view/139', () => HttpResponse.text(accountDisabledHtml)),
  http.get('https://www.furaffinity.net/view/131', () => HttpResponse.text(blockedHtml)),
  http.get('https://www.furaffinity.net/view/140', () => HttpResponse.text(offlineHtml)),
  http.get('https://www.furaffinity.net/view/141', () => HttpResponse.text(imageBbcodeDescHtml)),
  http.get('https://www.furaffinity.net/view/142', () => HttpResponse.text(imageRichDescHtml)),
  http.get('https://www.furaffinity.net/view/132', () => new HttpResponse(null, { status: 500 })),

  // Asset requests for images (ranged GET for size + dimensions)
  http.get('https://d.furaffinity.net/art/testartist/123/test.jpg', () =>
    imageResponse('image/jpeg', 1048576, jpegHeader(1200, 800)),
  ),
  http.get('https://d.furaffinity.net/art/testartist/124/test.gif', () =>
    imageResponse('image/gif', 1048576, gifHeader(640, 480)),
  ),
  http.get('https://d.furaffinity.net/art/testartist/125/large.jpg', () =>
    imageResponse('image/jpeg', 6291456, jpegHeader(4000, 3000)),
  ),
  http.get('https://d.furaffinity.net/art/testartist/134/test.jpg', () =>
    imageResponse('image/jpeg', 1048576, jpegHeader(1200, 800)),
  ),
  http.get('https://d.furaffinity.net/art/testartist/137/test.jpg', () =>
    imageResponse('image/jpeg', null, jpegHeader(1200, 800)),
  ),
  http.get('https://d.furaffinity.net/art/testartist/138/test.jpg', () =>
    imageResponse('image/jpeg', 1048576, jpegHeader(1200, 800)),
  ),
  http.get('https://d.furaffinity.net/art/testartist/141/test.jpg', () =>
    imageResponse('image/jpeg', 1048576, jpegHeader(1200, 800)),
  ),
  http.head(
    'https://d.furaffinity.net/art/testartist/142/test.jpg',
    () => new HttpResponse(null, { headers: { 'content-length': '1048576', 'content-type': 'image/jpeg' } }),
  ),

  // Story text fetch
  http.get('https://d.furaffinity.net/art/testartist/126/story.txt', () =>
    HttpResponse.text('Once upon a time in a land far away there lived a brave adventurer.'),
  ),
  http.get('https://d.furaffinity.net/art/testartist/135/story.txt', () =>
    HttpResponse.text('A new layout story excerpt.'),
  ),

  // Audio HEAD requests
  http.head(
    'https://d.furaffinity.net/art/testartist/127/song.mp3',
    () => new HttpResponse(null, { headers: { 'content-length': '5000000', 'content-type': 'audio/mpeg' } }),
  ),
  http.head(
    'https://d.furaffinity.net/art/testartist/136/song.mp3',
    () => new HttpResponse(null, { headers: { 'content-length': '5000000', 'content-type': 'audio/mpeg' } }),
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

describe('healthcheck', () => {
  it('returns 200 with status ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
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
    expect(body).toContain('og:image:width" content="1200"');
    expect(body).toContain('og:image:height" content="800"');
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

  it('parses submission correctly with new FA layout (.submission-page-stats)', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/134', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Image New Layout');
    expect(body).toContain('og:image');
    expect(body).toContain('https://d.furaffinity.net/art/testartist/134/test.jpg');
    expect(body).toContain('1,234');
    expect(body).toContain('56');
    expect(body).toContain('789');
  });

  it('renders embed when og:description is empty', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/138', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Test Image Empty Desc');
    expect(response.body).toContain('og:image');
  });

  it('strips BBCode tags from the description', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/141', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Bold and red text');
    expect(body).not.toContain('[b]');
    expect(body).not.toContain('[color=red]');
    expect(body).not.toContain('[url=');
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
    expect(body).toContain('og:image:width" content="1200"');
    expect(body).toContain('og:image:height" content="800"');
    expect(body).not.toContain('application/json+oembed');
  });

  it('falls back to thumbnail when image is >5MB', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/125', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('og:image" content="https://t.furaffinity.net/125@400-thumb.jpg"');
    expect(body).not.toContain('og:image" content="https://d.furaffinity.net/art/testartist/125/large.jpg"');
    expect(body).not.toContain('og:image:width');
  });

  it('falls back to thumbnail when content-length header is missing', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/137', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('og:image" content="https://t.furaffinity.net/137@400-thumb.jpg"');
    expect(response.body).not.toContain('og:image" content="https://d.furaffinity.net/art/testartist/137/test.jpg"');
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

describe('telegram instant view', () => {
  it('renders an article body with title, author and image for images', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('<body>');
    expect(body).toContain('<article>');
    expect(body).toContain('<h1>Test Image</h1>');
    expect(body).toContain('rel="author"');
    expect(body).toContain('<figure><img src="https://d.furaffinity.net/art/testartist/123/test.jpg"');
  });

  it('does not emit a body for non-telegram bots', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/123', headers: { 'user-agent': DISCORD_UA } });
    expect(response.body).not.toContain('<body>');
  });

  it('renders the story text as paragraphs for stories', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/126', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('<article>');
    expect(body).toContain('<h1>Test Story</h1>');
    expect(body).toContain('Once upon a time');
  });

  it('renders an audio element for music', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/127', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('<article>');
    expect(body).toContain('<audio src="https://d.furaffinity.net/art/testartist/127/song.mp3"');
  });

  it('renders the full rich description (not the truncated og snippet)', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/142', headers: { 'user-agent': TELEGRAM_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    const article = body.slice(body.indexOf('<article>'));
    // Full text from .submission-description-text, not the truncated og:description snippet
    expect(article).toContain('Full description with a');
    expect(article).toContain('Second line kept.');
    expect(article).not.toContain('A truncated snippet');
    // Avatar icon link becomes an @username text link; external redirect is unwrapped
    expect(article).toContain('<a href="https://www.furaffinity.net/user/friend">@friend</a>');
    expect(article).toContain('href="https://example.com/art"');
    expect(article).toContain('<b>link</b>');
    // Styling and avatar images stripped
    expect(body).not.toContain('color:red');
    expect(body).not.toContain('a.furaffinity.net/x/friend.gif');
  });
});

describe('story embeds', () => {
  it('generates story embed with excerpt in description', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/126', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Story');
    expect(body).toContain('Once upon a time');
  });

  it('parses story correctly with new FA layout', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/135', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Story New Layout');
    expect(body).toContain('A new layout story excerpt.');
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

  it('parses music correctly with new FA layout', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/136', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toContain('Test Music New Layout');
    expect(body).toContain('og:audio');
    expect(body).toContain('d.furaffinity.net/art/testartist/136/song.mp3');
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

  it('returns Session Expired for login-required page (title-based detection)', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/133', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Session Expired');
  });

  it('returns Account Disabled for disabled account page', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/139', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Account Disabled');
  });

  it('returns Blocked for Cloudflare-blocked page', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/131', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Blocked by FurAffinity');
  });

  it('returns FurAffinity Offline for temporarily offline page', async () => {
    const response = await app.inject({ method: 'GET', url: '/view/140', headers: { 'user-agent': DISCORD_UA } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('FurAffinity Offline');
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
      http.head(
        'https://d.furaffinity.net/art/testartist/123/test.jpg',
        () => new HttpResponse(null, { headers: { 'content-length': '1048576', 'content-type': 'image/jpeg' } }),
      ),
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
