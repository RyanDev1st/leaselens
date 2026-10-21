import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

function token(name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m) throw new Error(`token --${name} not found`);
  return m[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('WCAG AA contrast', () => {
  const AA = 4.5;
  const pairs: [string, string, string][] = [
    ['ink on paper', 'ink', 'paper'],
    ['ink on page', 'ink', 'page'],
    ['muted on page', 'muted', 'page'],
    ['muted on paper', 'muted', 'paper'],
    ['on-accent on accent', 'on-accent', 'accent'],
    ['accent link on page', 'accent', 'page'],
    ['accent link on paper', 'accent', 'paper'],
    ['high label on its tint', 'high-fg', 'high-bg'],
    ['medium label on its tint', 'med-fg', 'med-bg'],
    ['low label on its tint', 'low-fg', 'low-bg'],
    ['ink on high highlight', 'ink', 'high-bg'],
    ['ink on medium highlight', 'ink', 'med-bg'],
    ['ink on low highlight', 'ink', 'low-bg'],
    ['high band text on paper', 'high-fg', 'paper'],
    ['medium band text on paper', 'med-fg', 'paper'],
    ['low band text on paper', 'low-fg', 'paper'],
  ];
  for (const [label, fg, bg] of pairs) {
    it(`${label} is at least ${AA}:1`, () => {
      expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(AA);
    });
  }

  it('risk line colours are visible against paper (3:1 for non-text)', () => {
    for (const t of ['high-line', 'med-line', 'low-line']) {
      expect(contrast(token(t), token('paper'))).toBeGreaterThanOrEqual(3);
    }
  });
});
