import type { SubmissionInfo } from '../furaffinity/submissionInfo.js';
import { OpenGraphBuilder } from './openGraphBuilder.js';

export function generateGenericEmbed(info: SubmissionInfo): string {
  const builder = new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(info.description)
    .withUrl(info.url);

  if (info.contentType === 'video/mp4') {
    builder.withVideo(info.imageUrl, info.contentType);
  } else {
    builder.withImage(info.imageUrl, info.contentType);
  }

  return builder.build();
}
