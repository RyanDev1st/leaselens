import type { Analysis, Finding, Severity } from '../engine/types';
import { buildCombinedMessage } from '../engine/messages';
import { copyWithFeedback } from './clipboard';
import { h } from './dom';

export const SEVERITY_LABEL: Record<Severity, string> = { high: 'High risk', medium: 'Medium risk', low: 'Low risk' };

export interface CardsView {
  el: HTMLElement;
  cards: Map<string, HTMLElement>;
}

export function renderCards(
  analysis: Analysis,
  onShowInLease: (finding: Finding) => void,
  onSelect: (finding: Finding) => void,
): CardsView {
  const cards = new Map<string, HTMLElement>();
  const list = h('div', { class: 'card-list' });
  const filterBar = h('div', { class: 'filters', role: 'group', 'aria-label': 'Filter findings by risk' });
  const empty = h('p', { class: 'empty', hidden: true }, 'No findings at this level.');
  let active: 'all' | Severity = 'all';

  const applyFilter = (): void => {
    let shown = 0;
    for (const f of analysis.findings) {
      const card = cards.get(f.id)!;
      const visible = active === 'all' || f.severity === active;
      card.hidden = !visible;
      if (visible) shown++;
    }
    empty.hidden = shown !== 0;
    filterBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === active)));
  };

  const levels: ('all' | Severity)[] = ['all', 'high', 'medium', 'low'];
  for (const level of levels) {
    const count = level === 'all' ? analysis.findings.length : analysis.counts[level];
    const btn = h(
      'button',
      { type: 'button', class: 'filter', 'data-level': level, 'aria-pressed': String(level === 'all') },
      `${level === 'all' ? 'All' : level[0].toUpperCase() + level.slice(1)} ${count}`,
    );
    btn.addEventListener('click', () => {
      active = level;
      applyFilter();
    });
    filterBar.append(btn);
  }

  for (const f of analysis.findings) {
    const manual = h('div', { class: 'manual' });
    const preview = h(
      'details',
      { class: 'message-preview' },
      h('summary', {}, 'Read the message'),
      h('pre', { class: 'message-text' }, f.message),
    );
    const showBtn = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Show in lease');
    const copyBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Copy message');
    showBtn.addEventListener('click', () => onShowInLease(f));
    copyBtn.addEventListener('click', () => void copyWithFeedback(f.message, 'Message', manual));

    const card = h(
      'article',
      { class: `card card-${f.severity}`, id: `finding-${f.id}`, 'data-finding': f.id, tabindex: '-1', 'aria-labelledby': `title-${f.id}` },
      h('p', { class: `sev sev-${f.severity}` }, SEVERITY_LABEL[f.severity]),
      h('h3', { id: `title-${f.id}` }, f.title),
      h('blockquote', { class: 'quote' }, f.sentence),
      h('p', { class: 'explain' }, f.explain),
      h('dl', { class: 'facts' }, h('dt', {}, 'What is normal'), h('dd', {}, f.normal), h('dt', {}, 'Why it matters'), h('dd', {}, f.why)),
      preview,
      h('div', { class: 'row' }, copyBtn, showBtn),
      manual,
    );
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button, summary, textarea, details')) return;
      onSelect(f);
    });
    cards.set(f.id, card);
    list.append(card);
  }

  const combined = buildCombinedMessage(analysis.findings);
  const manualAll = h('div', { class: 'manual' });
  const copyAll = h('button', { type: 'button', class: 'btn' }, 'Copy one message for all high and medium findings');
  copyAll.addEventListener('click', () => void copyWithFeedback(combined, 'Combined message', manualAll));

  const el = h(
    'section',
    { class: 'findings', 'aria-label': 'Findings' },
    h('header', { class: 'findings-head' }, h('span', { class: 'eyebrow' }, 'Findings'), filterBar),
    combined ? h('div', { class: 'copy-all' }, copyAll, manualAll) : null,
    empty,
    list,
  );
  if (analysis.findings.length === 0) {
    list.append(
      h(
        'div',
        { class: 'all-clear' },
        h('h3', {}, 'No flagged clauses'),
        h('p', {}, 'None of the 26 checks matched this text. That is encouraging, but it is a first pass: the rules look for known patterns and can miss unusual wording.'),
        h('p', {}, 'Read the whole lease once, and ask the landlord about anything you do not understand. If the text looks short or cut off, paste the full lease and check again.'),
      ),
    );
  }
  applyFilter();
  return { el, cards };
}
