import { describe, expect, it } from 'vitest';
import { stripBbcode } from '../src/furaffinity/bbcode.js';

describe('stripBbcode', () => {
  it('removes simple formatting tags but keeps inner text', () => {
    expect(stripBbcode('[b]Hello[/b] [i]world[/i]')).toBe('Hello world');
  });

  it('removes tags with attributes', () => {
    expect(stripBbcode('[color=red]red[/color] [url=https://furaffinity.net]link[/url]')).toBe('red link');
  });

  it('is case-insensitive', () => {
    expect(stripBbcode('[B]bold[/B] [Quote=Someone]hi[/QUOTE]')).toBe('bold hi');
  });

  it('strips alignment, spoiler, and nested tags', () => {
    expect(stripBbcode('[center][b][spoiler]secret[/spoiler][/b][/center]')).toBe('secret');
  });

  it('leaves unpaired brackets (FA prose like [YCH]/[WIP]) untouched', () => {
    expect(stripBbcode('[WIP] commission [b]open[/b]')).toBe('[WIP] commission open');
    expect(stripBbcode('[Commissions OPEN] check my [i]page[/i]')).toBe('[Commissions OPEN] check my page');
  });

  it('strips a stray/malformed known tag (opening or closing only)', () => {
    expect(stripBbcode('[b]bold with no close')).toBe('bold with no close');
    expect(stripBbcode('text with dangling close[/i]')).toBe('text with dangling close');
    expect(stripBbcode('[color=red]red with no close')).toBe('red with no close');
  });

  it('leaves a stray unknown bracket in place', () => {
    expect(stripBbcode('[YCH] slots open')).toBe('[YCH] slots open');
    expect(stripBbcode('[unknown]no close here')).toBe('[unknown]no close here');
  });

  it('unwraps properly nested pairs', () => {
    expect(stripBbcode('[b][i]text[/i][/b]')).toBe('text');
    expect(stripBbcode('[quote=Someone][b]nested[/b] quote[/quote]')).toBe('nested quote');
    expect(stripBbcode('[b]x[b]y[/b]z[/b]')).toBe('xyz');
  });

  it('unwraps improperly nested pairs', () => {
    expect(stripBbcode('[b][i]text[/b][/i]')).toBe('text');
  });

  it('trims surrounding whitespace left by stripped tags', () => {
    expect(stripBbcode('[center]centered[/center]')).toBe('centered');
  });

  it('returns an empty string unchanged', () => {
    expect(stripBbcode('')).toBe('');
  });

  it('leaves plain text without BBCode unchanged', () => {
    expect(stripBbcode('Just a normal description.')).toBe('Just a normal description.');
  });

  it('strips a real FA description with nested [left]/[b]/[color=#hex] and emoji', () => {
    const input =
      '[left][b][color=#bcc7d7]  A real scorcher of a day 🌞 🌿 [/color][/b][/left]\n' +
      '[left][i][color=#9fadc1]  Personal art  [/color][/i][/left]';
    // Interior whitespace is preserved on purpose: it may be intentional spacing
    // an artist placed inside the tags rather than around them.
    expect(stripBbcode(input)).toBe('A real scorcher of a day 🌞 🌿 \n  Personal art');
  });
});
