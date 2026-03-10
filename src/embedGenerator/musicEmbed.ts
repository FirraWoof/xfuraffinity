import type { MusicInfo } from '../furaffinity/submissionInfo.js';
import { OpenGraphBuilder } from './openGraphBuilder.js';

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function generateMusicEmbed(info: MusicInfo, oEmbedUrl?: string): string {
  const stats = `👁 ${fmt(info.viewCount)}  💬 ${fmt(info.commentCount)}  ⭐ ${fmt(info.faveCount)}`;
  const fullDescription = info.description ? `${stats}\n\n${info.description}` : stats;

  const builder = new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(fullDescription)
    .withUrl(info.url)
    .withImage(info.thumbnailUrl, 'image/jpeg')
    .withAudio(info.audioUrl, info.audioContentType);

  if (oEmbedUrl) {
    builder.withOEmbed(oEmbedUrl);
  }

  return builder.build();
}

export function generateMusicTelegramEmbed(info: MusicInfo): string {
  const stats = `👁 ${fmt(info.viewCount)}  💬 ${fmt(info.commentCount)}  ⭐ ${fmt(info.faveCount)}`;
  const fullDescription = info.description ? `${stats}\n\n${info.description}` : stats;

  return new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(fullDescription)
    .withUrl(info.url)
    .withImage(info.thumbnailUrl, 'image/jpeg')
    .build();
}
