import * as cheerio from 'cheerio';
import type { SubmissionResult } from './submissionInfo.js';

const SUBMISSION_NOT_FOUND_TEXT = 'not in our database';
const UNAUTHENTICATED_TEXT = 'please log in';
const CLOUDFLARE_JS_REQUIRED_TEXT = 'enable javascript and cookies to continue';
const CLOUDFLARE_CHECKING_TEXT = 'checking your browser';

export function parseSubmissionPage(html: string): SubmissionResult {
  const $ = cheerio.load(html);

  if ($('#challenge-form').length > 0) {
    return { type: 'blocked' };
  }

  const pageText = $.root().text().toLowerCase();
  if (pageText.includes(CLOUDFLARE_JS_REQUIRED_TEXT) || pageText.includes(CLOUDFLARE_CHECKING_TEXT)) {
    return { type: 'blocked' };
  }

  const sectionBodyText = $('.section-body').text();
  if (sectionBodyText.includes(SUBMISSION_NOT_FOUND_TEXT)) {
    return { type: 'notFound' };
  }
  if (sectionBodyText.toLowerCase().includes(UNAUTHENTICATED_TEXT)) {
    return { type: 'unauthenticated' };
  }

  if ($('#flash_embed').length > 0) {
    return { type: 'flash' };
  }

  const url = $('meta[property*="og:url"]').attr('content');
  const title = $('meta[property*="og:title"]').attr('content');
  const description = $('meta[property*="og:description"]').attr('content');
  const viewCountText = $('div.views span').first().text();
  const commentCountText = $('section.stats-container div.comments span').first().text();
  const faveCountText = $('div.favorites span').first().text();
  const downloadHref = $('div.download a').attr('href');
  const thumbnailSrc = $('#submissionImg').attr('data-preview-src');

  if (!url || !title || !description || !downloadHref || !thumbnailSrc) {
    throw new Error(
      `Failed to parse submission page: missing fields (url=${url}, title=${title}, download=${downloadHref}, thumbnail=${thumbnailSrc})`
    );
  }

  const viewCount = parseInt(viewCountText, 10);
  const commentCount = parseInt(commentCountText, 10);
  const faveCount = parseInt(faveCountText, 10);

  if (isNaN(viewCount) || isNaN(commentCount) || isNaN(faveCount)) {
    throw new Error(
      `Failed to parse submission counts (views="${viewCountText}", comments="${commentCountText}", faves="${faveCountText}")`
    );
  }

  return {
    type: 'image',
    info: {
      url,
      title,
      description,
      viewCount,
      commentCount,
      faveCount,
      imageUrl: `https:${downloadHref}`,
      sizeBytes: 0, // filled in by client after HEAD request
      thumbnailUrl: `https:${thumbnailSrc}`,
    },
  };
}
