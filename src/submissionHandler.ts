import { sendAlert } from './alerting.js';
import { getCached, setCached } from './cache.js';
import type { Config } from './config.js';
import { fetchSubmissionInfo } from './furaffinity/client.js';
import { generateGenericEmbed } from './embedGenerator/genericEmbed.js';
import { generateMessageEmbed } from './embedGenerator/messageEmbed.js';
import { generateTelegramEmbed } from './embedGenerator/telegramEmbed.js';
import { classifyRequester } from './requester.js';

export type HandlerResult =
  | { type: 'redirect'; url: string }
  | { type: 'embed'; html: string };

export async function handleSubmission(
  id: number,
  userAgent: string,
  config: Config
): Promise<HandlerResult> {
  const requester = classifyRequester(userAgent);

  if (requester === 'human') {
    return { type: 'redirect', url: `https://www.furaffinity.net/view/${id}` };
  }

  try {
    const cached = await getCached(config.cacheDir, id);
    const result = cached ?? await fetchSubmissionInfo(id, { a: config.sessionA, b: config.sessionB });
    if (!cached) await setCached(config.cacheDir, id, result);

    switch (result.type) {
      case 'image': {
        const html =
          requester === 'telegram'
            ? generateTelegramEmbed(result.info)
            : generateGenericEmbed(result.info);
        return { type: 'embed', html };
      }
      case 'flash':
        return {
          type: 'embed',
          html: generateMessageEmbed('Unsupported Submission', 'Flash content cannot be shown as a preview'),
        };
      case 'notFound':
        return {
          type: 'embed',
          html: generateMessageEmbed('Not Found', `The submission ${id} was not found on FurAffinity`),
        };
      case 'serverError':
        return {
          type: 'embed',
          html: generateMessageEmbed(
            'FA Down',
            'FurAffinity responded with a server error, which means it\'s probably down at the moment, or encountered an error'
          ),
        };
      case 'unauthenticated':
        await sendAlert(config.alertingUrl, 'FurAffinity credentials are expired or invalid');
        return {
          type: 'embed',
          html: generateMessageEmbed(
            'Session Expired',
            "FurAffinity has invalidated xfuraffinity's session, please try again later."
          ),
        };
      case 'blocked':
        return {
          type: 'embed',
          html: generateMessageEmbed('Blocked by FurAffinity', 'FurAffinity is blocking automated access'),
        };
    }
  } catch (err) {
    console.error('handleSubmission error:', err);
    const message = err instanceof Error ? err.message : String(err);
    await sendAlert(config.alertingUrl, message);
    return {
      type: 'embed',
      html: generateMessageEmbed(
        'xfuraffinity Error',
        'An unexpected error occurred. Please report this at github.com/FirraWoof/xfuraffinity'
      ),
    };
  }
}
