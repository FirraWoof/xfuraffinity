import * as cheerio from 'cheerio';
import { stripBbcode } from './bbcode.js';
import { cleanDescriptionHtml, plainToHtml } from './description.js';
import type { SubmissionInfo } from './submissionInfo.js';

type SubmissionPageInfo = Omit<SubmissionInfo, 'sizeBytes' | 'contentType' | 'width' | 'height'>;
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
  | { type: 'accountDisabled' }
  | { type: 'blocked' }
  | { type: 'temporarilyOffline' };

const SUBMISSION_NOT_FOUND_TEXT = 'not in our database';
const UNAUTHENTICATED_TEXT = 'please log in';
const LOGIN_REQUIRED_TITLE = 'login required';
const ACCOUNT_DISABLED_TITLE = 'account disabled';
const FA_OFFLINE_TITLE = 'temporarily offline';
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

  // Check for login required page (expired/invalid session)
  const pageTitle = $('title').text().toLowerCase();
  if (pageTitle.startsWith(LOGIN_REQUIRED_TITLE)) {
    return { type: 'unauthenticated' };
  }
  if (pageTitle.startsWith(ACCOUNT_DISABLED_TITLE)) {
    return { type: 'accountDisabled' };
  }
  if (pageTitle.includes(FA_OFFLINE_TITLE)) {
    return { type: 'temporarilyOffline' };
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
  const rawDescription = $('meta[property*="og:description"]').attr('content');
  const viewCountText =
    $('.submission-page-stats div[title="Views"] div').first().text().trim() || $('div.views span').first().text(); // fallback old layout
  const commentCountText =
    $('.submission-page-stats div[title="Comments"] div').first().text().trim() ||
    $('section.stats-container div.comments span').first().text();
  const faveCountText =
    $('.submission-page-stats div[title="Favorites"] div').first().text().trim() ||
    $('div.favorites span').first().text();
  const thumbnailSrc = $('#submissionImg').attr('data-preview-src');
  const newArtistLink = $('.submission-description-artist .c-usernameBlockSimple a[href^="/user/"]').first();
  const artistLink = newArtistLink.length ? newArtistLink : $('.submission-id-sub-container a[href^="/user/"]').first(); // fallback old layout
  const artistName = artistLink.text().trim();
  const artistHref = artistLink.attr('href');

  if (!url || !title || rawDescription === undefined || !thumbnailSrc || !artistName || !artistHref) {
    throw new Error(
      `Failed to parse submission page: missing fields (url=${url}, title=${title}, description=${rawDescription}, thumbnail=${thumbnailSrc}, artist=${artistName})`,
    );
  }

  const description = stripBbcode(rawDescription);
  const descriptionTextEl = $('.submission-description-text').first();
  const descriptionHtml = descriptionTextEl.length
    ? cleanDescriptionHtml(descriptionTextEl.html() ?? '')
    : plainToHtml(description);

  const viewCount = parseInt(viewCountText, 10);
  const commentCount = parseInt(commentCountText, 10);
  const faveCount = parseInt(faveCountText, 10);

  if (Number.isNaN(viewCount) || Number.isNaN(commentCount) || Number.isNaN(faveCount)) {
    throw new Error(
      `Failed to parse submission counts (views="${viewCountText}", comments="${commentCountText}", faves="${faveCountText}")`,
    );
  }

  const commonInfo: CommonPageInfo = {
    url,
    title,
    description,
    descriptionHtml,
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

  // New FA layout: Download button in #submission-options
  const downloadHref =
    $('#submission-options a[href^="//d.furaffinity.net"]').attr('href') || $('div.download a').attr('href'); // fallback old layout
  if (!downloadHref) {
    throw new Error(`Failed to parse submission page: missing download href (url=${url})`);
  }

  return {
    type: 'image',
    info: { ...commonInfo, imageUrl: `https:${downloadHref}` },
  };
}
