import type { SubmissionInfo } from '../furaffinity/submissionInfo.js';
import { OpenGraphBuilder } from './openGraphBuilder.js';

const FIVE_MB = 1024 * 1024 * 5;
const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function generateImageEmbed(info: SubmissionInfo, oEmbedUrl?: string): string {
  const stats = `👁 ${fmt(info.viewCount)}  💬 ${fmt(info.commentCount)}  ⭐ ${fmt(info.faveCount)}`;
  const fullDescription = info.description ? `${stats}\n\n${info.description}` : stats;

  const builder = new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(fullDescription)
    .withUrl(info.url);

  if (oEmbedUrl) {
    builder.withOEmbed(oEmbedUrl);
  }

  if (info.contentType === 'video/mp4') {
    builder.withVideo(info.imageUrl, info.contentType);
  } else {
    builder.withImage(info.imageUrl, info.contentType);
  }

  return builder.build();
}

export function generateImageTelegramEmbed(info: SubmissionInfo): string {
  const stats = `👁 ${fmt(info.viewCount)}  💬 ${fmt(info.commentCount)}  ⭐ ${fmt(info.faveCount)}`;
  const fullDescription = info.description ? `${stats}\n\n${info.description}` : stats;

  const builder = new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(fullDescription)
    .withUrl(info.url);

  const mediaUrl = chooseImageEmbedUrl(info);
  if (info.contentType === 'image/gif' || info.contentType === 'video/mp4') {
    // Telegram needs video/mp4 to render GIFs
    builder.withVideo(mediaUrl, 'video/mp4');
  } else {
    builder.withImage(mediaUrl, info.contentType);
  }

  return builder.build();
}

function chooseImageEmbedUrl(info: SubmissionInfo): string {
  if (info.sizeBytes < FIVE_MB) return info.imageUrl;
  // GIF and video are kept as-is even if large; images fall back to thumbnail
  if (info.contentType === 'image/gif' || info.contentType === 'video/mp4') return info.imageUrl;
  return info.thumbnailUrl;
}
