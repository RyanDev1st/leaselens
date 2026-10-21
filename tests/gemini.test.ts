import { describe, expect, it, vi } from 'vitest';
import { DeeperError, GEMINI_ENDPOINT, MAX_CHARS, buildRequest, deeperRead, describeDeeperError, mapHttpError, parseResponse } from '../src/ai/gemini';

describe('gemini deeper read (mocked fetch)', () => {
  it('builds a request containing the lease and plain-English instructions', () => {
    const req = buildRequest('Rent is $900.');
    const text = req.contents[0].parts[0].text;
    expect(text).toContain('Rent is $900.');
    expect(text).toContain('not a lawyer');
  });

  it('truncates very long leases', () => {
    const req = buildRequest('x'.repeat(MAX_CHARS + 5000));
    expect(req.contents[0].parts[0].text.length).toBeLessThan(MAX_CHARS + 1500);
  });

  it('sends the key in a header, only to Google, and returns the text', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'A summary.' }] } }] }), { status: 200 }));
    const out = await deeperRead('KEY123', 'lease text', fetchMock as unknown as typeof fetch);
    expect(out).toBe('A summary.');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(GEMINI_ENDPOINT);
    expect(url.startsWith('https://generativelanguage.googleapis.com/')).toBe(true);
    expect(url).not.toContain('KEY123');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('KEY123');
  });

  it('maps HTTP failures to friendly codes', async () => {
    expect(mapHttpError(400)).toBe('invalid-key');
    expect(mapHttpError(403)).toBe('invalid-key');
    expect(mapHttpError(429)).toBe('quota');
    expect(mapHttpError(500)).toBe('unknown');
    const bad = vi.fn(async () => new Response('{}', { status: 429 }));
    await expect(deeperRead('k', 't', bad as unknown as typeof fetch)).rejects.toMatchObject({ code: 'quota' });
  });

  it('reports offline when fetch throws', async () => {
    const off = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(deeperRead('k', 't', off as unknown as typeof fetch)).rejects.toBeInstanceOf(DeeperError);
    await expect(deeperRead('k', 't', off as unknown as typeof fetch)).rejects.toMatchObject({ code: 'offline' });
  });

  it('treats an empty answer as an error and every error has a message', () => {
    expect(() => parseResponse({ candidates: [] })).toThrow();
    for (const c of ['invalid-key', 'quota', 'offline', 'blocked', 'empty', 'unknown'] as const) {
      expect(describeDeeperError(c).length).toBeGreaterThan(20);
    }
  });
});
