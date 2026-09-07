import * as cheerio from 'cheerio';
import { escapeHtml } from '../html.js';

const FA_BASE = 'https://www.furaffinity.net';
const ALLOWED_TAGS = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 'br']);

// FA submission descriptions are rich HTML (user-icon links, bbcode spans, colours, avatars).
// Reduce them to a small, safe subset suitable for a Telegram Instant View article body.
export function cleanDescriptionHtml(rawInnerHtml: string): string {
  const $ = cheerio.load(rawInnerHtml, null, false);

  // User-icon links carry only an avatar image; turn them into @username text links.
  $('a.iconusername').each((_, el) => {
    const user = ($(el).attr('href') ?? '').replace(/^\/user\//, '').replace(/\/$/, '');
    $(el).replaceWith(user ? `<a href="${FA_BASE}/user/${escapeHtml(user)}">@${escapeHtml(user)}</a>` : '');
  });

  $('img').remove();

  // Normalise links: resolve to absolute URLs, unwrap FA's external redirector, drop other attributes.
  $('a').each((_, el) => {
    const resolved = resolveHref($(el).attr('href'));
    if (!resolved) {
      $(el).replaceWith($(el).contents());
      return;
    }
    el.attribs = { href: resolved };
  });

  // Unwrap anything outside the allowlist, keeping its children; strip attributes from what remains.
  $('*').each((_, node) => {
    if (!('tagName' in node)) return;
    if (!ALLOWED_TAGS.has(node.tagName)) {
      $(node).replaceWith($(node).contents());
    } else if (node.tagName !== 'a') {
      node.attribs = {};
    }
  });

  return collapseWhitespace($.root().html() ?? '');
}

export function plainToHtml(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, '<br />');
}

function resolveHref(href: string | undefined): string | null {
  const trimmed = href?.trim();
  if (!trimmed) return null;
  if (trimmed.includes('/externalurl/?q=')) {
    const q = new URL(trimmed, FA_BASE).searchParams.get('q');
    if (q) return q;
  }
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${FA_BASE}${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function collapseWhitespace(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/\s*(<br\s*\/?>)\s*/g, '$1')
    .trim();
}
