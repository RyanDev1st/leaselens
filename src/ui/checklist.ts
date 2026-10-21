import type { Analysis } from '../engine/types';
import { DISCLAIMER, UNIVERSAL_QUESTIONS, checklistItems, checklistMarkdown } from '../engine/checklist';
import { h } from './dom';

export function createChecklistDialog(analysis: Analysis): HTMLDialogElement {
  const items = checklistItems(analysis.findings);
  const groups = (['high', 'medium', 'low'] as const)
    .map((sev) => ({ sev, list: items.filter((i) => i.severity === sev) }))
    .filter((g) => g.list.length);

  const body = h('div', { class: 'checklist-body' });
  body.append(
    h('p', { class: 'small' }, `Risk score ${analysis.score} of 100 (${analysis.band}). Bring this to the landlord or a friend before you sign.`),
  );
  for (const g of groups) {
    body.append(
      h('h3', {}, `${g.sev[0].toUpperCase()}${g.sev.slice(1)} priority`),
      h(
        'ul',
        { class: 'checks' },
        ...g.list.map((i) =>
          h('li', {}, h('span', { class: 'box', 'aria-hidden': 'true' }), h('span', {}, i.question, ' ', h('span', { class: 'tag' }, i.title))),
        ),
      ),
    );
  }
  body.append(
    h('h3', {}, 'Always ask'),
    h('ul', { class: 'checks' }, ...UNIVERSAL_QUESTIONS.map((q) => h('li', {}, h('span', { class: 'box', 'aria-hidden': 'true' }), h('span', {}, q)))),
    h('p', { class: 'small disclaimer' }, DISCLAIMER),
  );

  const printBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Print checklist');
  const downloadBtn = h('button', { class: 'btn', type: 'button' }, 'Download as Markdown');
  const closeBtn = h('button', { class: 'btn btn-quiet dialog-close', type: 'button' }, 'Close');

  const dialog = h(
    'dialog',
    { class: 'sheet sheet-wide', 'aria-labelledby': 'checklist-title', id: 'checklist-dialog' },
    h('div', { class: 'sheet-head' }, h('h2', { id: 'checklist-title' }, 'Questions to ask before signing'), closeBtn),
    body,
    h('div', { class: 'row no-print' }, printBtn, downloadBtn),
  );

  closeBtn.addEventListener('click', () => dialog.close());
  printBtn.addEventListener('click', () => {
    document.body.dataset.print = 'checklist';
    window.print();
  });
  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([checklistMarkdown(analysis)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: 'questions-before-signing.md' });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  window.addEventListener('afterprint', () => {
    delete document.body.dataset.print;
  });
  return dialog;
}
