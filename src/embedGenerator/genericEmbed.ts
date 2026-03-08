import { guessContentType } from '../furaffinity/imageUrl.js';
import type { SubmissionInfo } from '../furaffinity/submissionInfo.js';
import { OpenGraphBuilder } from './openGraphBuilder.js';

export function generateGenericEmbed(info: SubmissionInfo): string {
  const builder = new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary_large_image')
    .withTitle(info.title)
    .withDescription(info.description)
    .withUrl(info.url);

  const contentTypeResult = guessContentType(info.imageUrl);
  if (contentTypeResult.isErr()) {
    throw new Error(contentTypeResult.error);
  }

  const contentType = contentTypeResult.value;
  if (contentType === 'video/mp4') {
    builder.withVideo(info.imageUrl, contentType);
  } else {
    builder.withImage(info.imageUrl, contentType);
  }

  return builder.build();
}
