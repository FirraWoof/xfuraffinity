import { parseSubmissionPage } from './submission.js';
import type { SubmissionResult } from './submissionInfo.js';

export type Session = { a: string; b: string };

const BASE_URL = 'https://www.furaffinity.net';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
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

  console.log(`GET ${submissionUrl}`);
  const response = await fetch(submissionUrl, {
    headers: { ...BROWSER_HEADERS, Cookie: cookieHeader },
  });

  if (response.status >= 500) {
    return { type: 'serverError' };
  }

  const html = await response.text();
  const result = parseSubmissionPage(html);

  if (result.type !== 'image') {
    return result;
  }

  const sizeBytes = await fetchImageSize(result.info.imageUrl, cookieHeader);
  return { type: 'image', info: { ...result.info, sizeBytes } };
}

async function fetchImageSize(imageUrl: string, cookieHeader: string): Promise<number> {
  console.log(`HEAD ${imageUrl}`);
  const response = await fetch(imageUrl, {
    method: 'HEAD',
    headers: { ...BROWSER_HEADERS, Cookie: cookieHeader },
  });

  const contentLength = response.headers.get('content-length');
  if (!contentLength) {
    throw new Error(`content-length header missing from HEAD ${imageUrl}`);
  }

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) {
    throw new Error(`Could not parse content-length "${contentLength}" from HEAD ${imageUrl}`);
  }

  return size;
}
