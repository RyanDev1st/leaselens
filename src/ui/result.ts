import type { Analysis, Finding, Severity } from '../engine/types';
import { DISCLAIMER } from '../engine/checklist';
import { renderCards } from './cards';
import { createChecklistDialog } from './checklist';
import { createDeeperDialog } from './deeper';
import { h, smoothScroll } from './dom';
import { renderLease } from './lease';

const SEVERITIES: Severity[] = ['high', 'medium', 'low'];

function summaryBand(analysis: Analysis): HTMLElement {
  const total = Math.max(1, analysis.findings.length);
  const bar = h(
    'div',
    { class: 'sevbar', role: 'img', 'aria-label': `${analysis.counts.high} high, ${analysis.counts.medium} medium, ${analysis.counts.low} low findings` },
    ...SEVERITIES.filter((s) => analysis.counts[s] > 0).map((s) =>
      h('span', { class: `seg seg-${s}`, style: `flex:${analysis.counts[s] / total}` }),
    ),
  );
  if (analysis.findings.length === 0) bar.append(h('span', { class: 'seg seg-none', style: 'flex:1' }));
  const legend = h(
    'ul',
    { class: 'legend' },
    ...SEVERITIES.map((s) =>
      h('li', {}, h('span', { class: `swatch swatch-${s}`, 'aria-hidden': 'true' }), `${s[0].toUpperCase()}${s.slice(1)}`, ' ', h('strong', {}, String(analysis.counts[s]))),
    ),
  );
  return h(
    'section',
    { class: 'summary', 'aria-label': 'Risk summary' },
    h(
      'div',
      { class: 'score' },
      h('span', { class: 'eyebrow' }, 'Risk score'),
      h('p', { class: 'score-line' }, h('span', { class: 'score-num' }, String(analysis.score)), h('span', { class: 'score-of' }, ' of 100')),
      h('p', { class: `band band-${analysis.band.toLowerCase().replace(' ', '-')}` }, `${analysis.band} risk`),
    ),
    h('div', { class: 'mix' }, h('span', { class: 'eyebrow' }, 'Mix of findings'), bar, legend),
    h('div', { class: 'read' }, h('span', { class: 'eyebrow' }, 'First read'), h('p', { class: 'read-text' }, analysis.summary)),
  );
}

export function renderResult(analysis: Analysis, label: string, onNew: () => void): HTMLElement {
  const findingById = new Map<string, Finding>(analysis.findings.map((f) => [f.id, f]));
  const highlightFor = new Map<string, number>();
  analysis.highlights.forEach((hl, i) => hl.findingIds.forEach((id) => highlightFor.set(id, i)));

  let tab: 'lease' | 'findings' = 'findings';
  const root = h('div', { class: 'result', 'data-tab': tab });

  const setTab = (next: 'lease' | 'findings'): void => {
    tab = next;
    root.dataset.tab = next;
    tabLease.setAttribute('aria-selected', String(next === 'lease'));
    tabFindings.setAttribute('aria-selected', String(next === 'findings'));
    tabLease.tabIndex = next === 'lease' ? 0 : -1;
    tabFindings.tabIndex = next === 'findings' ? 0 : -1;
  };
  const isNarrow = (): boolean => window.matchMedia('(max-width: 900px)').matches;

  const lease = renderLease(analysis, label, (hl, index) => {
    const ids = hl.findingIds;
    const current = lease.el.querySelector('.hl.is-selected') === lease.marks[index] ? cardsView.el.querySelector('.card.is-selected')?.getAttribute('data-finding') : null;
    const at = current ? ids.indexOf(current) : -1;
    select(ids[(at + 1) % ids.length], 'mark');
  });

  const cardsView = renderCards(
    analysis,
    (f) => select(f.id, 'card'),
    (f) => select(f.id, 'card-click'),
  );

  function select(id: string, source: 'mark' | 'card' | 'card-click'): void {
    const f = findingById.get(id);
    if (!f) return;
    root.querySelectorAll('.is-selected').forEach((n) => n.classList.remove('is-selected'));
    const card = cardsView.cards.get(id)!;
    const mark = lease.marks[highlightFor.get(id)!];
    card.classList.add('is-selected');
    mark?.classList.add('is-selected');

    if (source === 'mark') {
      if (isNarrow()) setTab('findings');
      card.hidden = false;
      smoothScroll(card, 'nearest');
      card.focus({ preventScroll: true });
    } else if (source === 'card') {
      if (isNarrow()) setTab('lease');
      if (mark) {
        smoothScroll(mark, 'center');
        mark.classList.remove('pulse');
        void mark.offsetWidth;
        mark.classList.add('pulse');
        mark.focus({ preventScroll: true });
      }
    } else if (mark && !isNarrow()) {
      smoothScroll(mark, 'center');
    }
  }

  const checklistDialog = createChecklistDialog(analysis);
  const deeperDialog = createDeeperDialog(() => analysis.text);

  const newBtn = h('button', { class: 'btn btn-quiet', type: 'button' }, 'New lease');
  newBtn.addEventListener('click', onNew);
  const checklistBtn = h('button', { class: 'btn', type: 'button' }, 'Checklist');
  checklistBtn.addEventListener('click', () => checklistDialog.showModal());
  const deeperBtn = h('button', { class: 'btn', type: 'button' }, 'Deeper read');
  deeperBtn.addEventListener('click', () => deeperDialog.showModal());
  const printBtn = h('button', { class: 'btn', type: 'button' }, 'Print report');
  printBtn.addEventListener('click', () => {
    document.body.dataset.print = 'report';
    window.print();
  });

  const tabLease = h('button', { class: 'tab', role: 'tab', id: 'tab-lease', 'aria-controls': 'lease-panel', 'aria-selected': 'false', tabindex: '-1', type: 'button' }, 'Lease');
  const tabFindings = h(
    'button',
    { class: 'tab', role: 'tab', id: 'tab-findings', 'aria-controls': 'findings-panel', 'aria-selected': 'true', type: 'button' },
    `Findings (${analysis.findings.length})`,
  );
  tabLease.addEventListener('click', () => setTab('lease'));
  tabFindings.addEventListener('click', () => setTab('findings'));
  const tabKeys = (e: Event): void => {
    const key = (e as KeyboardEvent).key;
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
      e.preventDefault();
      const next = tab === 'lease' ? 'findings' : 'lease';
      setTab(next);
      (next === 'lease' ? tabLease : tabFindings).focus();
    }
  };
  tabLease.addEventListener('keydown', tabKeys);
  tabFindings.addEventListener('keydown', tabKeys);

  lease.el.id = 'lease-panel';
  lease.el.setAttribute('role', 'tabpanel');
  lease.el.setAttribute('aria-labelledby', 'tab-lease');
  cardsView.el.id = 'findings-panel';
  cardsView.el.setAttribute('role', 'tabpanel');
  cardsView.el.setAttribute('aria-labelledby', 'tab-findings');

  root.append(
    h(
      'header',
      { class: 'result-head' },
      h('div', {}, h('h1', { tabindex: '-1', id: 'view-title' }, 'Your lease review'), h('p', { class: 'file-label' }, label)),
      h('div', { class: 'row no-print' }, checklistBtn, deeperBtn, printBtn, newBtn),
    ),
    summaryBand(analysis),
    h('div', { class: 'tabs no-print', role: 'tablist', 'aria-label': 'Switch between the lease and the findings' }, tabLease, tabFindings),
    h('div', { class: 'split' }, lease.el, cardsView.el),
    h('p', { class: 'disclaimer' }, DISCLAIMER),
    checklistDialog,
    deeperDialog,
  );
  setTab('findings');
  return root;
}
