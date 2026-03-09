import type { SubmissionInfo } from '../furaffinity/submissionInfo.js';
import { OpenGraphBuilder } from './openGraphBuilder.js';

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function generateGenericEmbed(info: SubmissionInfo, oEmbedUrl?: string): string {
  const stats = `👁 ${fmt(info.viewCount)}  💬 ${fmt(info.commentCount)}  ⭐ ${fmt(info.faveCount)}`;
  const fullDescription = info.description ? `${info.description}\n\n${stats}` : stats;

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
