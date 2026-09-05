import type { ContentType } from './submissionInfo.js';

export type ImageDimensions = { width: number; height: number };

export function parseImageDimensions(buffer: Buffer, contentType: ContentType): ImageDimensions | null {
  try {
    if (contentType === 'image/png') return parsePng(buffer);
    if (contentType === 'image/gif') return parseGif(buffer);
    if (contentType === 'image/jpeg') return parseJpeg(buffer);
    return null;
  } catch {
    return null;
  }
}

function parsePng(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function parseGif(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 10 || buffer.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function parseJpeg(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  return null;
}
