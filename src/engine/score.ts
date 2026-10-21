import type { Band, Finding, Severity } from './types';

export const WEIGHTS: Record<Severity, number> = { high: 14, medium: 7, low: 3 };

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

/** 0 to 100, higher is riskier. Saturating so a long lease cannot exceed 100. */
export function scoreFor(counts: Record<Severity, number>): number {
  const raw = counts.high * WEIGHTS.high + counts.medium * WEIGHTS.medium + counts.low * WEIGHTS.low;
  return Math.round(100 * (1 - Math.exp(-raw / 150)));
}

export function bandFor(score: number): Band {
  if (score < 25) return 'Lower';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Very high';
}

export function summarize(findings: Finding[], counts: Record<Severity, number>): string {
  if (findings.length === 0) {
    return 'No clauses matched the checks in this first pass. That is not a guarantee: read the whole lease and ask about anything unclear.';
  }
  const total = findings.length;
  const order = { high: 0, medium: 1, low: 2 } as const;
  const top = [...findings].sort((a, b) => order[a.severity] - order[b.severity] || a.start - b.start);
  const names = top.slice(0, 2).map((f) => f.title.toLowerCase());
  const lead = `${total} ${total === 1 ? 'clause' : 'clauses'} worth a closer look`;
  const detail = `${counts.high} high, ${counts.medium} medium, ${counts.low} low.`;
  const focus = names.length === 2 ? `Start with ${names[0]} and ${names[1]}.` : `Start with ${names[0]}.`;
  return `${lead}: ${detail} ${focus}`;
}
