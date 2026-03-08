import { OpenGraphBuilder } from './openGraphBuilder.js';

export function generateMessageEmbed(title: string, body: string): string {
  return new OpenGraphBuilder()
    .withDefaultMetadata()
    .withTwitterCard('summary')
    .withTitle(title)
    .withDescription(body)
    .build();
}
