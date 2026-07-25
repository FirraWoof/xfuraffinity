// FurAffinity descriptions can leak raw BBCode markup into the og:description
// meta tag. We clean it up in two passes so embeds read as plain prose:
//   1. Remove any matched [tag]...[/tag] pair, keeping its inner text. This
//      catches every real tag without maintaining an exhaustive list, and
//      leaves unpaired brackets FA artists use in prose (e.g. "[YCH]", "[WIP]",
//      "[Commissions OPEN]") untouched.
//   2. Remove leftover stray/malformed known tags (an opening or closing tag
//      with no partner). Scoped to known tags so we don't eat unknown prose
//      brackets that survived pass 1.
const KNOWN_TAGS = [
  'b',
  'i',
  'u',
  's',
  'sub',
  'sup',
  'left',
  'center',
  'right',
  'quote',
  'url',
  'color',
  'spoiler',
  'yt',
];

const BBCODE_PAIR_PATTERN = /\[([a-z0-9]+)(?:=[^\]]*)?\]([\s\S]*?)\[\/\1\]/gi;
const KNOWN_TAG_PATTERN = new RegExp(`\\[/?(?:${KNOWN_TAGS.join('|')})(?:=[^\\]]*)?\\]`, 'gi');

function stripPairs(text: string): string {
  const stripped = text.replace(BBCODE_PAIR_PATTERN, '$2');
  return stripped === text ? text : stripPairs(stripped);
}

export function stripBbcode(text: string): string {
  return stripPairs(text).replace(KNOWN_TAG_PATTERN, '').trim();
}
