import { describe, expect, it } from 'vitest';
import { classifyRequester, identifyService } from '../src/requester.js';

const fluxerUa = 'Mozilla/5.0 (compatible; Fluxerbot/1.0; +https://fluxer.app)';

describe('classifyRequester', () => {
  it('classifies Fluxer as a bot so it receives an embed', () => {
    expect(classifyRequester(fluxerUa)).toBe('otherBot');
  });

  it('still classifies plain browsers as human', () => {
    expect(classifyRequester('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('human');
  });
});

describe('identifyService', () => {
  it('identifies Fluxer distinctly from a browser', () => {
    expect(identifyService(fluxerUa)).toBe('fluxer');
  });
});
