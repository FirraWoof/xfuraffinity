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
      normalized.includes('discord') ||
      normalized.includes('fluxerbot');

    return isBotUA ? 'otherBot' : 'human';
  }

  return 'otherBot';
}

export function identifyService(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('telegram')) return 'telegram';
  if (ua.includes('discord')) return 'discord';
  if (ua.includes('fluxerbot')) return 'fluxer';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('slackbot')) return 'slack';
  if (ua.includes('facebookexternalhit') || ua.includes('facebookbot')) return 'facebook';
  if (ua.includes('twitterbot')) return 'twitter';
  if (ua.includes('linkedinbot')) return 'linkedin';
  if (ua.includes('valve steam')) return 'steam';
  if (ua.includes('applebot')) return 'applebot';
  if (ua.includes('imessage')) return 'imessage';
  if (ua.includes('iframely')) return 'iframely';
  if (ua.includes('embedly')) return 'embedly';
  if (ua.includes('signal')) return 'signal';

  if (ua.startsWith('mozilla/5.0')) return 'browser';

  // For unrecognized bots, extract the first token (e.g. "BotName/1.0 ..." → "botname")
  const firstToken = userAgent.split(/[\s/]/)[0].toLowerCase();
  return firstToken.length > 0 && firstToken.length < 40 ? firstToken : 'unknown';
}
