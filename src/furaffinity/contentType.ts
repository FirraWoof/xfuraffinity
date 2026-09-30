import { err, ok, type Result } from 'neverthrow';
import type { ContentType } from './submissionInfo.js';

export function sniffContentType(buffer: Buffer): ContentType | null {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return 'image/gif';
  }
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') return 'video/mp4';
  return null;
}

export function guessContentType(url: string): Result<ContentType, string> {
  const ext = url.split('.').pop();

  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return ok('image/jpeg');
    case 'png':
      return ok('image/png');
    case 'gif':
      return ok('image/gif');
    case 'mp4':
      return ok('video/mp4');
    default:
      return err(`Unknown content type for URL: ${url}`);
  }
}
