import * as cheerio from 'cheerio';
import type { SubmissionInfo } from './submissionInfo.js';

type SubmissionPageInfo = Omit<SubmissionInfo, 'sizeBytes' | 'contentType'>;
type CommonPageInfo = Omit<SubmissionPageInfo, 'imageUrl'>;
type StoryPageInfo = CommonPageInfo & { contentUrl: string; extension: string };
type MusicPageInfo = CommonPageInfo & { audioUrl: string };

export type SubmissionPageResult =
  | { type: 'image'; info: SubmissionPageInfo }
  | { type: 'story'; info: StoryPageInfo }
  | { type: 'music'; info: MusicPageInfo }
  | { type: 'flash' }
  | { type: 'notFound' }
  | { type: 'unauthenticated' }
  | { type: 'blocked' };

const SUBMISSION_NOT_FOUND_TEXT = 'not in our database';
const UNAUTHENTICATED_TEXT = 'please log in';
const CLOUDFLARE_JS_REQUIRED_TEXT = 'enable javascript and cookies to continue';
const CLOUDFLARE_CHECKING_TEXT = 'checking your browser';

export function parseSubmissionPage(html: string): SubmissionPageResult {
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
  const thumbnailSrc = $('#submissionImg').attr('data-preview-src');
  const artistLink = $('.submission-id-sub-container a[href^="/user/"]').first();
  const artistName = artistLink.text().trim();
  const artistHref = artistLink.attr('href');

  if (!url || !title || !description || !thumbnailSrc || !artistName || !artistHref) {
    throw new Error(
      `Failed to parse submission page: missing fields (url=${url}, title=${title}, thumbnail=${thumbnailSrc}, artist=${artistName})`
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

  const commonInfo: CommonPageInfo = {
    url,
    title,
    description,
    viewCount,
    commentCount,
    faveCount,
    thumbnailUrl: `https:${thumbnailSrc}`,
    artistName,
    artistUrl: `https://www.furaffinity.net${artistHref}`,
  };

  const script = $('script[data-content-type]');
  const faContentType = script.attr('data-content-type');

  if (faContentType === 'music') {
    const audioSrc = $('#c-musicPlayer_inner').attr('src');
    if (!audioSrc) {
      throw new Error('Failed to parse music submission: missing audio URL');
    }
    return { type: 'music', info: { ...commonInfo, audioUrl: `https:${audioSrc}` } };
  }

  if (faContentType === 'text') {
    const contentUrl = script.attr('data-content-url');
    const extension = script.attr('data-content-extension');
    if (!contentUrl || !extension) {
      throw new Error('Failed to parse story submission: missing content URL or extension');
    }
    return { type: 'story', info: { ...commonInfo, contentUrl: `https:${contentUrl}`, extension } };
  }

  const downloadHref = $('div.download a').attr('href');
  if (!downloadHref) {
    throw new Error(`Failed to parse submission page: missing download href (url=${url})`);
  }

  return {
    type: 'image',
    info: { ...commonInfo, imageUrl: `https:${downloadHref}` },
  };
}
