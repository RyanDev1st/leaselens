import type { Analysis, Finding, Highlight } from '../engine/types';
import { isHeading } from '../engine/text';
import { h } from './dom';

export interface LeaseView {
  el: HTMLElement;
  /** One element per highlight, in the same order as analysis.highlights. */
  marks: HTMLElement[];
}

const SEVERITY_LABEL = { high: 'High risk', medium: 'Medium risk', low: 'Low risk' } as const;

/** Draws the lease as a paper page with each risky sentence marked in place. */
export function renderLease(
  analysis: Analysis,
  label: string,
  onMark: (highlight: Highlight, index: number) => void,
): LeaseView {
  const byId = new Map<string, Finding>(analysis.findings.map((f) => [f.id, f]));
  const marks: HTMLElement[] = [];
  const page = h('div', { class: 'paper-body', lang: 'en' });

  let offset = 0;
  let nextHighlight = 0;
  for (const line of analysis.text.split('\n')) {
    const lineStart = offset;
    const lineEnd = offset + line.length;
    offset = lineEnd + 1;
    if (!line.trim()) continue;

    const p = h('p', { class: isHeading(line) ? 'lease-heading' : 'lease-line' });
    let cursor = lineStart;
    while (nextHighlight < analysis.highlights.length && analysis.highlights[nextHighlight].start < lineEnd) {
      const hl = analysis.highlights[nextHighlight];
      if (hl.end <= lineStart) {
        nextHighlight++;
        continue;
      }
      const from = Math.max(hl.start, lineStart);
      const to = Math.min(hl.end, lineEnd);
      if (from > cursor) p.append(analysis.text.slice(cursor, from));
      const titles = hl.findingIds.map((id) => byId.get(id)?.title ?? '').filter(Boolean);
      const index = nextHighlight;
      const mark = h(
        'mark',
        {
          class: `hl hl-${hl.severity}`,
          tabindex: '0',
          role: 'button',
          'data-highlight': String(index),
          'aria-label': `${SEVERITY_LABEL[hl.severity]}: ${titles.join(', ')}. Press Enter to open the finding.`,
        },
        analysis.text.slice(from, to),
      );
      mark.addEventListener('click', () => onMark(hl, index));
      mark.addEventListener('keydown', (e) => {
        const key = (e as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          onMark(hl, index);
        }
      });
      marks[index] = mark;
      p.append(mark);
      cursor = to;
      nextHighlight++;
    }
    if (cursor < lineEnd) p.append(analysis.text.slice(cursor, lineEnd));
    page.append(p);
  }

  const el = h(
    'section',
    { class: 'paper', 'aria-label': 'Your lease with risky clauses highlighted' },
    h('header', { class: 'paper-head' }, h('span', { class: 'eyebrow' }, 'Lease text'), h('span', { class: 'paper-title' }, label)),
    page,
  );
  return { el, marks };
}
