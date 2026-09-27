import { describe, expect, it } from 'vitest';
import { classifyRequester, identifyService } from '../src/requester.js';

const fluxerUa = 'Mozilla/5.0 (compatible; Fluxerbot/1.0; +https://fluxer.app)';
const stoatUa = 'Mozilla/5.0 (compatible; January/2.0; +https://github.com/stoatchat/stoatchat)';
const namedStoatUa = 'Mozilla/5.0 (compatible; StOaTbOt/1.0; +https://stoat.chat)';

describe('classifyRequester', () => {
  it('classifies Fluxer as a bot so it receives an embed', () => {
    expect(classifyRequester(fluxerUa)).toBe('otherBot');
  });

  it('classifies the Stoat preview crawler as a bot so it receives an embed', () => {
    expect(classifyRequester(stoatUa)).toBe('otherBot');
  });

  it('classifies a named Stoat crawler case-insensitively', () => {
    expect(classifyRequester(namedStoatUa)).toBe('otherBot');
  });

  it('still classifies plain browsers as human', () => {
    expect(classifyRequester('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('human');
  });
});

describe('identifyService', () => {
  it('identifies Fluxer distinctly from a browser', () => {
    expect(identifyService(fluxerUa)).toBe('fluxer');
  });

  it('identifies the January preview crawler as Stoat', () => {
    expect(identifyService(stoatUa)).toBe('stoat');
  });

  it('identifies a named Stoat crawler case-insensitively', () => {
    expect(identifyService(namedStoatUa)).toBe('stoat');
  });
});
