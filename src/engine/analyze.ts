import type { Analysis, Finding, Highlight, Severity } from './types';
import { RULES } from './rules';
import { splitSentences } from './text';
import { buildMessage } from './messages';
import { bandFor, countBySeverity, scoreFor, summarize } from './score';

const ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Pure, deterministic analysis of a lease. Never touches the network. */
export function analyze(text: string): Analysis {
  const normalized = text.replace(/\r\n?/g, '\n');
  // Matching works on a copy with typographic quotes flattened. The replacement is
  // one character for one character, so offsets stay valid for the original text.
  const matchable = normalized.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const sentences = splitSentences(matchable);
  const ctx = { fullText: matchable };
  const raw: Omit<Finding, 'id'>[] = [];

  for (const sentence of sentences) {
    if (sentence.heading) continue;
    for (const rule of RULES) {
      const severity = rule.detect(sentence.text, ctx);
      if (!severity) continue;
      const shown = normalized.slice(sentence.start, sentence.end);
      raw.push({
        ruleId: rule.id,
        title: rule.title,
        severity,
        start: sentence.start,
        end: sentence.end,
        sentence: shown,
        explain: rule.explain,
        normal: rule.normal,
        why: rule.why,
        ask: rule.ask,
        question: rule.question,
        message: buildMessage(rule.ask, shown),
      });
    }
  }

  // Cards: most serious first, then in document order.
  raw.sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.start - b.start);
  const findings: Finding[] = raw.map((f, i) => ({ ...f, id: `f${i + 1}` }));

  const byStart = new Map<number, Highlight>();
  for (const f of findings) {
    const h = byStart.get(f.start);
    if (h) {
      h.findingIds.push(f.id);
      if (ORDER[f.severity] < ORDER[h.severity]) h.severity = f.severity;
    } else {
      byStart.set(f.start, { start: f.start, end: f.end, severity: f.severity, findingIds: [f.id] });
    }
  }
  const highlights = [...byStart.values()].sort((a, b) => a.start - b.start);

  const counts = countBySeverity(findings);
  const score = scoreFor(counts);
  return {
    text: normalized,
    findings,
    highlights,
    score,
    band: bandFor(score),
    counts,
    summary: summarize(findings, counts),
  };
}
