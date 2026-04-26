import { getCached, setCached } from './cache.js';
import type { Config } from './config.js';
import { fetchSubmissionInfo } from './furaffinity/client.js';
import type { ServerErrorDetail } from './furaffinity/submissionInfo.js';
import { generateImageEmbed, generateImageTelegramEmbed } from './embedGenerator/imageEmbed.js';
import { generateMessageEmbed } from './embedGenerator/messageEmbed.js';
import { generateMusicEmbed, generateMusicTelegramEmbed } from './embedGenerator/musicEmbed.js';
import { generateStoryEmbed } from './embedGenerator/storyEmbed.js';
import { noticeError } from './metrics.js';
import { classifyRequester } from './requester.js';

export type RequestMeta = {
  requester: 'human' | 'telegram' | 'otherBot';
  cached: boolean | null;
  submissionResult: string | null;
  serverError?: ServerErrorDetail;
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
    const cached = await getCached(config.cacheDir, id);
    const result = cached ?? await fetchSubmissionInfo(id, { a: config.sessionA, b: config.sessionB });
    if (!cached) await setCached(config.cacheDir, id, result);

    const meta: RequestMeta = { requester, cached: cached !== null, submissionResult: result.type };

    switch (result.type) {
      case 'image': {
        const oEmbedUrl = config.publicUrl ? `${config.publicUrl}/oembed?id=${id}` : undefined;
        const html =
          requester === 'telegram'
            ? generateImageTelegramEmbed(result.info)
            : generateImageEmbed(result.info, oEmbedUrl);
        return { type: 'embed', html, meta };
      }
      case 'story': {
        const oEmbedUrl = config.publicUrl ? `${config.publicUrl}/oembed?id=${id}` : undefined;
        return { type: 'embed', html: generateStoryEmbed(result.info, oEmbedUrl), meta };
      }
      case 'music': {
        const oEmbedUrl = config.publicUrl ? `${config.publicUrl}/oembed?id=${id}` : undefined;
        const html =
          requester === 'telegram'
            ? generateMusicTelegramEmbed(result.info)
            : generateMusicEmbed(result.info, oEmbedUrl);
        return { type: 'embed', html, meta };
      }
      case 'flash':
        return { type: 'embed', html: generateMessageEmbed('Unsupported Submission', 'Flash content cannot be shown as a preview'), meta };
      case 'notFound':
        return { type: 'embed', html: generateMessageEmbed('Not Found', `The submission ${id} was not found on FurAffinity`), meta };
      case 'serverError':
        return {
          type: 'embed',
          html: generateMessageEmbed('FA Down', 'FurAffinity responded with a server error, which means it\'s probably down at the moment, or encountered an error'),
          meta: { ...meta, serverError: result.detail },
        };
      case 'unauthenticated':
        return { type: 'embed', html: generateMessageEmbed('Session Expired', "FurAffinity has invalidated xfuraffinity's session, please try again later."), meta };
      case 'blocked':
        return { type: 'embed', html: generateMessageEmbed('Blocked by FurAffinity', 'FurAffinity is blocking automated access'), meta };
    }
  } catch (err) {
    noticeError(err);
    return {
      type: 'embed',
      html: generateMessageEmbed('xfuraffinity Error', 'An unexpected error occurred. Please report this at github.com/FirraWoof/xfuraffinity'),
      meta: { requester, cached: null, submissionResult: null, error: err },
    };
  }
}
