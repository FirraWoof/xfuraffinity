export type Requester = 'human' | 'telegram' | 'otherBot';

export function classifyRequester(userAgent: string): Requester {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes('telegram')) {
    return 'telegram';
  }

  if (normalized.startsWith('mozilla/5.0')) {
    const isBotUA =
      normalized.includes('facebook') ||
      normalized.includes('valve steam') ||
      normalized.includes('slack') ||
      normalized.includes('discord');

    return isBotUA ? 'otherBot' : 'human';
  }

  return 'otherBot';
}
