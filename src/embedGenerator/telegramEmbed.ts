import { guessContentType } from '../furaffinity/imageUrl.js';
import type { SubmissionInfo } from '../furaffinity/submissionInfo.js';
import { OpenGraphBuilder } from './openGraphBuilder.js';

const FIVE_MB = 1024 * 1024 * 5;

export function generateTelegramEmbed(info: SubmissionInfo): string {
  const builder = new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(info.description)
    .withUrl(info.url);

  const mediaUrl = chooseEmbedUrl(info);
  const contentTypeResult = guessContentType(mediaUrl);
  if (contentTypeResult.isErr()) {
    throw new Error(contentTypeResult.error);
  }

  const contentType = contentTypeResult.value;
  if (contentType === 'image/gif' || contentType === 'video/mp4') {
    // Telegram needs video/mp4 to render GIFs
    builder.withVideo(mediaUrl, 'video/mp4');
  } else {
    builder.withImage(mediaUrl, contentType);
  }

  return builder.build();
}

function chooseEmbedUrl(info: SubmissionInfo): string {
  if (info.sizeBytes < FIVE_MB) {
    return info.imageUrl;
  }

  const contentTypeResult = guessContentType(info.imageUrl);
  if (contentTypeResult.isErr()) {
    throw new Error(contentTypeResult.error);
  }

  const contentType = contentTypeResult.value;
  // GIF and video are kept as-is even if large; images fall back to thumbnail
  if (contentType === 'image/gif' || contentType === 'video/mp4') {
    return info.imageUrl;
  }

  return info.thumbnailUrl;
}
