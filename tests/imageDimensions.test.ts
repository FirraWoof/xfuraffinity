import { describe, expect, it } from 'vitest';
import { parseImageDimensions } from '../src/furaffinity/imageDimensions.js';

function png(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  buf.writeUInt32BE(0x89504e47, 0);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function gif(width: number, height: number): Buffer {
  const buf = Buffer.alloc(10);
  buf.write('GIF89a', 0, 'ascii');
  buf.writeUInt16LE(width, 6);
  buf.writeUInt16LE(height, 8);
  return buf;
}

function jpeg(width: number, height: number): Buffer {
  const buf = Buffer.alloc(11);
  buf.writeUInt16BE(0xffd8, 0);
  buf.writeUInt16BE(0xffc0, 2);
  buf.writeUInt16BE(0x0011, 4);
  buf.writeUInt8(0x08, 6);
  buf.writeUInt16BE(height, 7);
  buf.writeUInt16BE(width, 9);
  return buf;
}

describe('parseImageDimensions', () => {
  it('reads PNG dimensions from the IHDR header', () => {
    expect(parseImageDimensions(png(920, 1096), 'image/png')).toEqual({ width: 920, height: 1096 });
  });

  it('reads GIF dimensions from the logical screen descriptor', () => {
    expect(parseImageDimensions(gif(1000, 475), 'image/gif')).toEqual({ width: 1000, height: 475 });
  });

  it('reads JPEG dimensions from the SOF marker', () => {
    expect(parseImageDimensions(jpeg(2558, 1440), 'image/jpeg')).toEqual({ width: 2558, height: 1440 });
  });

  it('skips a preceding JPEG segment to find the SOF marker', () => {
    const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]);
    const buf = Buffer.concat([Buffer.from([0xff, 0xd8]), app0, jpeg(300, 200).subarray(2)]);
    expect(parseImageDimensions(buf, 'image/jpeg')).toEqual({ width: 300, height: 200 });
  });

  it('returns null when the SOF marker is not within the buffer', () => {
    expect(parseImageDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x02]), 'image/jpeg')).toBeNull();
  });

  it('returns null for video content', () => {
    expect(parseImageDimensions(jpeg(100, 100), 'video/mp4')).toBeNull();
  });

  it('returns null on malformed data instead of throwing', () => {
    expect(parseImageDimensions(Buffer.from([0x00, 0x01, 0x02]), 'image/png')).toBeNull();
  });
});
