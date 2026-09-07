import type { MusicInfo, StoryInfo, SubmissionInfo } from '../furaffinity/submissionInfo.js';
import { escapeHtml } from '../html.js';

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

// Telegram Instant View templates extract content by XPath against this markup,
// so the structure (article > h1 > byline > media > body > stats footer) must stay stable.

type ArticleMeta = {
  title: string;
  artistName: string;
  artistUrl: string;
  descriptionHtml: string;
  viewCount: number;
  commentCount: number;
  faveCount: number;
};

function renderArticle(meta: ArticleMeta, mediaBlock: string, extraBlock = ''): string {
  const parts = [
    `<h1>${escapeHtml(meta.title)}</h1>`,
    `<address>by <a rel="author" href="${escapeHtml(meta.artistUrl)}">${escapeHtml(meta.artistName)}</a></address>`,
    mediaBlock,
    extraBlock,
    meta.descriptionHtml ? `<section class="description">${meta.descriptionHtml}</section>` : '',
    `<footer>👁 ${fmt(meta.viewCount)} · 💬 ${fmt(meta.commentCount)} · ⭐ ${fmt(meta.faveCount)}</footer>`,
  ].filter(Boolean);

  return `<article>\n  ${parts.join('\n  ')}\n</article>`;
}

export function renderImageInstantViewBody(info: SubmissionInfo): string {
  // IV re-fetches media server-side and has no 5MB card limit, so always use the full-resolution URL.
  const media =
    info.contentType === 'video/mp4'
      ? `<video src="${escapeHtml(info.imageUrl)}" controls="controls"></video>`
      : `<img src="${escapeHtml(info.imageUrl)}" alt="${escapeHtml(info.title)}" />`;

  return renderArticle(info, `<figure>${media}</figure>`);
}

export function renderStoryInstantViewBody(info: StoryInfo): string {
  const figure = `<figure><img src="${escapeHtml(info.thumbnailUrl)}" alt="${escapeHtml(info.title)}" /></figure>`;
  const excerpt = info.excerpt
    ? `<blockquote>${escapeHtml(info.excerpt).replace(/\r?\n/g, '<br />')}</blockquote>`
    : '';

  return renderArticle(info, figure, excerpt);
}

export function renderMusicInstantViewBody(info: MusicInfo): string {
  const figure = `<figure><img src="${escapeHtml(info.thumbnailUrl)}" alt="${escapeHtml(info.title)}" /></figure>`;
  const audio = `<audio src="${escapeHtml(info.audioUrl)}" controls="controls"></audio>`;

  return renderArticle(info, figure, audio);
}
