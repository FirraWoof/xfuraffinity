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
  if (info.contentType === 'image/gif' || info.contentType === 'video/mp4') {
    // Telegram needs video/mp4 to render GIFs
    builder.withVideo(mediaUrl, 'video/mp4');
  } else {
    builder.withImage(mediaUrl, info.contentType);
  }

  return builder.build();
}

function chooseEmbedUrl(info: SubmissionInfo): string {
  if (info.sizeBytes < FIVE_MB) {
    return info.imageUrl;
  }

  // GIF and video are kept as-is even if large; images fall back to thumbnail
  if (info.contentType === 'image/gif' || info.contentType === 'video/mp4') {
    return info.imageUrl;
  }

  return info.thumbnailUrl;
}
