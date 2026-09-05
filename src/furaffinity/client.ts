import { guessContentType } from './contentType.js';
import { parseImageDimensions } from './imageDimensions.js';
import { parseSubmissionPage } from './submission.js';
import type { AudioContentType, ContentType, SubmissionResult } from './submissionInfo.js';

export type Session = { a: string; b: string };

const BASE_URL = 'https://www.furaffinity.net';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

export async function fetchSubmissionInfo(id: number, session: Session): Promise<SubmissionResult> {
  const submissionUrl = `${BASE_URL}/view/${id}`;
  const cookieHeader = `a=${session.a}; b=${session.b}`;

  const response = await fetch(submissionUrl, {
    headers: { ...BROWSER_HEADERS, Cookie: cookieHeader },
  });

  if (response.status >= 500) {
    return {
      type: 'serverError',
      detail: {
        status: response.status,
        statusText: response.statusText,
        cfRay: response.headers.get('cf-ray'),
        bodySnippet: await readBodySnippet(response),
      },
    };
  }

  const html = await response.text();
  const result = parseSubmissionPage(html);

  if (result.type === 'image') {
    const { sizeBytes, contentType, width, height } = await fetchImageMeta(result.info.imageUrl, cookieHeader);
    return { type: 'image', info: { ...result.info, sizeBytes, contentType, width, height } };
  }

  if (result.type === 'story') {
    const excerpt = result.info.extension === 'txt' ? await fetchTextExcerpt(result.info.contentUrl) : null;
    return { type: 'story', info: { ...result.info, excerpt } };
  }

  if (result.type === 'music') {
    const { audioContentType, audioSizeBytes } = await fetchAudioMeta(result.info.audioUrl);
    return { type: 'music', info: { ...result.info, audioContentType, audioSizeBytes } };
  }

  return result;
}

const IMAGE_HEADER_BYTES = 65536;

async function fetchImageMeta(
  imageUrl: string,
  cookieHeader: string,
): Promise<{ sizeBytes: number | null; contentType: ContentType; width: number | null; height: number | null }> {
  const response = await fetch(imageUrl, {
    headers: { ...BROWSER_HEADERS, Cookie: cookieHeader, Range: `bytes=0-${IMAGE_HEADER_BYTES - 1}` },
  });

  const contentType = parseContentType(response.headers.get('content-type'), imageUrl);
  const sizeBytes = parseImageSize(response);
  const header = await readPrefix(response, IMAGE_HEADER_BYTES);
  const dimensions = parseImageDimensions(header, contentType);

  return { sizeBytes, contentType, width: dimensions?.width ?? null, height: dimensions?.height ?? null };
}

function parseImageSize(response: Response): number | null {
  const total = response.headers.get('content-range')?.split('/')[1];
  const parsedTotal = total ? parseInt(total, 10) : NaN;
  if (!Number.isNaN(parsedTotal)) return parsedTotal;

  const contentLength = response.headers.get('content-length');
  const parsed = contentLength ? parseInt(contentLength, 10) : NaN;
  return Number.isNaN(parsed) ? null : parsed;
}

async function readPrefix(response: Response, maxBytes: number): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) return Buffer.alloc(0);

  const chunks: Buffer[] = [];
  let received = 0;
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
    received += value.length;
  }
  await reader.cancel();
  return Buffer.concat(chunks);
}

function parseContentType(header: string | null, imageUrl: string): ContentType {
  const mimeType = header?.split(';')[0].trim();
  if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/gif' || mimeType === 'video/mp4') {
    return mimeType;
  }
  const fallback = guessContentType(imageUrl);
  if (fallback.isErr()) throw new Error(`Could not determine content type for ${imageUrl}: ${fallback.error}`);
  return fallback.value;
}

async function fetchTextExcerpt(contentUrl: string): Promise<string> {
  const response = await fetch(contentUrl, {
    headers: { Range: 'bytes=0-2048' },
  });

  const text = await response.text();
  return trimToWordBoundary(text.trim(), 400);
}

function trimToWordBoundary(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const trimmed = text.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 0 ? `${trimmed.slice(0, lastSpace)}…` : `${trimmed}…`;
}

async function fetchAudioMeta(
  audioUrl: string,
): Promise<{ audioContentType: AudioContentType; audioSizeBytes: number }> {
  const response = await fetch(audioUrl, { method: 'HEAD' });

  const contentLength = response.headers.get('content-length');
  if (!contentLength) {
    throw new Error(`content-length header missing from HEAD ${audioUrl}`);
  }

  const sizeBytes = parseInt(contentLength, 10);
  if (Number.isNaN(sizeBytes)) {
    throw new Error(`Could not parse content-length "${contentLength}" from HEAD ${audioUrl}`);
  }

  const mimeType = response.headers.get('content-type')?.split(';')[0].trim();
  if (!isAudioContentType(mimeType)) {
    throw new Error(`Unexpected audio content type "${mimeType}" from HEAD ${audioUrl}`);
  }

  return { audioContentType: mimeType, audioSizeBytes: sizeBytes };
}

async function readBodySnippet(response: Response, maxLen = 500): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, maxLen).replace(/\s+/g, ' ').trim();
  } catch {
    return '<failed to read body>';
  }
}

function isAudioContentType(mimeType: string | undefined): mimeType is AudioContentType {
  return (
    mimeType === 'audio/mpeg' ||
    mimeType === 'audio/ogg' ||
    mimeType === 'audio/wav' ||
    mimeType === 'audio/flac' ||
    mimeType === 'audio/mp4'
  );
}
