import { getCached, setCached } from './cache.js';
import type { Config } from './config.js';
import { fetchSubmissionInfo } from './furaffinity/client.js';
import { generateGenericEmbed } from './embedGenerator/genericEmbed.js';
import { generateMessageEmbed } from './embedGenerator/messageEmbed.js';
import { generateTelegramEmbed } from './embedGenerator/telegramEmbed.js';
import { cacheHitsTotal, errorsTotal, fafetchesTotal, submissionDuration, submissionResultsTotal } from './metrics.js';
import { classifyRequester } from './requester.js';

export type RequestMeta = {
  requester: 'human' | 'telegram' | 'otherBot';
  cached: boolean | null;
  submissionResult: string | null;
  error?: unknown;
};

export type HandlerResult =
  | { type: 'redirect'; url: string; meta: RequestMeta }
  | { type: 'embed'; html: string; meta: RequestMeta };

export async function handleSubmission(
  id: number,
  userAgent: string,
  config: Config
): Promise<HandlerResult> {
  const requester = classifyRequester(userAgent);

  if (requester === 'human') {
    return { type: 'redirect', url: `https://www.furaffinity.net/view/${id}`, meta: { requester, cached: null, submissionResult: null } };
  }

  try {
    const endTimer = submissionDuration.startTimer();
    const cached = await getCached(config.cacheDir, id);
    if (cached) {
      cacheHitsTotal.inc();
    } else {
      fafetchesTotal.inc();
    }
    const result = cached ?? await fetchSubmissionInfo(id, { a: config.sessionA, b: config.sessionB });
    if (!cached) await setCached(config.cacheDir, id, result);
    submissionResultsTotal.inc({ result: result.type });
    endTimer({ cached: String(cached !== null) });

    const meta: RequestMeta = { requester, cached: cached !== null, submissionResult: result.type };

    switch (result.type) {
      case 'image': {
        const oEmbedUrl = config.publicUrl ? `${config.publicUrl}/oembed?id=${id}` : undefined;
        const html =
          requester === 'telegram'
            ? generateTelegramEmbed(result.info)
            : generateGenericEmbed(result.info, oEmbedUrl);
        return { type: 'embed', html, meta };
      }
      case 'flash':
        return { type: 'embed', html: generateMessageEmbed('Unsupported Submission', 'Flash content cannot be shown as a preview'), meta };
      case 'notFound':
        return { type: 'embed', html: generateMessageEmbed('Not Found', `The submission ${id} was not found on FurAffinity`), meta };
      case 'serverError':
        return { type: 'embed', html: generateMessageEmbed('FA Down', 'FurAffinity responded with a server error, which means it\'s probably down at the moment, or encountered an error'), meta };
      case 'unauthenticated':
        return { type: 'embed', html: generateMessageEmbed('Session Expired', "FurAffinity has invalidated xfuraffinity's session, please try again later."), meta };
      case 'blocked':
        return { type: 'embed', html: generateMessageEmbed('Blocked by FurAffinity', 'FurAffinity is blocking automated access'), meta };
    }
  } catch (err) {
    errorsTotal.inc();
    return {
      type: 'embed',
      html: generateMessageEmbed('xfuraffinity Error', 'An unexpected error occurred. Please report this at github.com/FirraWoof/xfuraffinity'),
      meta: { requester, cached: null, submissionResult: null, error: err },
    };
  }
}
