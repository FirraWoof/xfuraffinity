import { Result, ok, err } from 'neverthrow';
import type { ContentType } from './submissionInfo.js';

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
