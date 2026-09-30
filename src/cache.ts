import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import type { SubmissionResult } from './furaffinity/submissionInfo.js';
import { noticeError } from './metrics.js';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

const CACHEABLE_TYPES = new Set(['image', 'story', 'music', 'flash', 'notFound']);

type CacheEntry = { cachedAt: number; result: SubmissionResult };

export async function ensureCacheDir(cacheDir: string): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
}

export async function getCached(cacheDir: string, id: number): Promise<SubmissionResult | null> {
  try {
    const raw = await readFile(`${cacheDir}/${id}.json`, 'utf-8');
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry.result;
  } catch {
    return null; // missing or malformed file = cache miss
  }
}

export async function setCached(cacheDir: string, id: number, result: SubmissionResult): Promise<void> {
  if (!CACHEABLE_TYPES.has(result.type)) return;
  const entry: CacheEntry = { cachedAt: Date.now(), result };
  // Unique tmp path per write: concurrent requests for the same id (e.g. Discord fetching
  // /view and /oembed together) would otherwise clobber each other's tmp file.
  const tmpPath = `${cacheDir}/${id}.json.${randomUUID()}.tmp`;
  const finalPath = `${cacheDir}/${id}.json`;
  try {
    await writeFile(tmpPath, JSON.stringify(entry));
    await rename(tmpPath, finalPath);
  } catch (err) {
    noticeError(err);
    await rm(tmpPath, { force: true }).catch(() => {});
  }
}
