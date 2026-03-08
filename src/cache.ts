import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import type { SubmissionResult } from './furaffinity/submissionInfo.js';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

const CACHEABLE_TYPES = new Set(['image', 'flash', 'notFound']);

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
  const tmpPath = `${cacheDir}/${id}.json.tmp`;
  const finalPath = `${cacheDir}/${id}.json`;
  await writeFile(tmpPath, JSON.stringify(entry));
  await rename(tmpPath, finalPath);
}
