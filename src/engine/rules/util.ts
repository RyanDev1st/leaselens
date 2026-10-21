import { findDurations } from '../text';

export const any = (s: string, ...res: RegExp[]): boolean => res.some((r) => r.test(s));
export const all = (s: string, ...res: RegExp[]): boolean => res.every((r) => r.test(s));

/** Largest notice period in days mentioned in the sentence (0 if none). */
export function maxDays(s: string): number {
  const d = findDurations(s, 'days');
  return d.length ? Math.max(...d) : 0;
}

/** Smallest notice period in hours mentioned in the sentence (Infinity if none). */
export function minHours(s: string): number {
  const h = findDurations(s, 'hours');
  return h.length ? Math.min(...h) : Infinity;
}

/** Largest dollar amount in the sentence (0 if none). */
export function maxDollars(s: string): number {
  const m = s.match(/\$\s?[\d,]+(?:\.\d+)?/g);
  if (!m) return 0;
  return Math.max(...m.map((x) => parseFloat(x.replace(/[$,\s]/g, ''))));
}

/** Largest percentage in the sentence (0 if none). */
export function maxPercent(s: string): number {
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/gi);
  if (!m) return 0;
  return Math.max(...m.map((x) => parseFloat(x)));
}
