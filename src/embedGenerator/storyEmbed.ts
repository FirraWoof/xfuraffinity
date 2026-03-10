import type { StoryInfo } from '../furaffinity/submissionInfo.js';
import { OpenGraphBuilder } from './openGraphBuilder.js';

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function generateStoryEmbed(info: StoryInfo, oEmbedUrl?: string): string {
  const stats = `👁 ${fmt(info.viewCount)}  💬 ${fmt(info.commentCount)}  ⭐ ${fmt(info.faveCount)}`;
  const excerptSection = info.excerpt ? `\n\n${info.excerpt}` : '';
  const fullDescription = info.description
    ? `📄 Story\n\n${info.description}${excerptSection}\n\n${stats}`
    : `📄 Story${excerptSection}\n\n${stats}`;

  const builder = new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(fullDescription)
    .withUrl(info.url)
    .withImage(info.thumbnailUrl, 'image/jpeg');

  if (oEmbedUrl) {
    builder.withOEmbed(oEmbedUrl);
  }

  return builder.build();
}
