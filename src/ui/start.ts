import { SAMPLES } from '../samples';
import { ExtractError, describeError, preloadPdfReader, readLeaseFile } from '../pdf/extract';
import { reflow } from '../pdf/reflow';
import { DISCLAIMER } from '../engine/checklist';
import { h } from './dom';

export const MIN_CHARS = 200;

export interface StartHandlers {
  onAnalyze: (text: string, label: string) => void;
}

function specimen(): HTMLElement {
  return h(
    'figure',
    { class: 'specimen', 'aria-label': 'Example of a highlighted clause' },
    h(
      'div',
      { class: 'specimen-paper' },
      h('p', { class: 'lease-heading' }, '3. Automatic Renewal'),
      h(
        'p',
        { class: 'lease-line' },
        'At the end of the term this lease ',
        h('span', { class: 'hl hl-high' }, 'will automatically renew for a further twelve (12) months unless Tenant gives written notice at least sixty (60) days before the end of the term.'),
      ),
    ),
    h(
      'div',
      { class: 'specimen-note' },
      h('p', { class: 'sev sev-high' }, 'High risk'),
      h('p', {}, h('strong', {}, 'Automatic renewal. '), 'Miss a deadline buried months earlier and you can be bound for another year.'),
      h('p', { class: 'small' }, 'Normal: month-to-month after the term, or a 30-day window.'),
    ),
    h('figcaption', { class: 'small' }, 'Every risky sentence is marked where it sits, with an explanation and a message you can send.'),
  );
}

export function renderStart({ onAnalyze }: StartHandlers): HTMLElement {
  preloadPdfReader();
  const textarea = h('textarea', {
    id: 'lease-text',
    rows: 9,
    placeholder: 'Paste the text of your lease here',
    spellcheck: 'false',
    'aria-describedby': 'paste-help',
  });
  const alertBox = h('div', { class: 'alert', role: 'alert', hidden: true });
  const loading = h('div', { class: 'loading', role: 'status', hidden: true }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('span', { class: 'loading-text' }, 'Reading your PDF in this browser'));
  const fileInput = h('input', { type: 'file', accept: '.pdf,application/pdf,.txt,text/plain', class: 'visually-hidden', id: 'lease-file', 'aria-label': 'Choose a PDF or text file' });
  const drop = h(
    'label',
    { class: 'drop', for: 'lease-file' },
    h('span', { class: 'drop-title' }, 'Drop a PDF here'),
    h('span', { class: 'small' }, 'or choose a file. PDFs are read on this device; nothing is uploaded.'),
  );
  const checkBtn = h('button', { class: 'btn btn-primary btn-large', type: 'button' }, 'Check my lease');

  const showError = (title: string, help: string): void => {
    alertBox.replaceChildren(h('strong', {}, title), h('p', {}, help));
    alertBox.hidden = false;
  };
  const clearError = (): void => {
    alertBox.hidden = true;
  };

  const analyzeText = (text: string, label: string): void => {
    clearError();
    if (text.replace(/\s/g, '').length < MIN_CHARS) {
      showError('That is a little short for a lease', `LeaseLens needs at least ${MIN_CHARS} characters to look for clauses. Paste more of the lease, or try a sample below.`);
      textarea.focus();
      return;
    }
    onAnalyze(text, label);
  };

  checkBtn.addEventListener('click', () => analyzeText(reflow(textarea.value), 'Pasted lease'));

  const handleFile = async (file: File): Promise<void> => {
    clearError();
    loading.hidden = false;
    drop.setAttribute('aria-busy', 'true');
    try {
      const text = await readLeaseFile(file);
      loading.hidden = true;
      analyzeText(text, file.name);
    } catch (err) {
      loading.hidden = true;
      const info = describeError(err instanceof ExtractError ? err.code : 'unreadable');
      showError(info.title, info.help);
      textarea.focus();
    } finally {
      drop.removeAttribute('aria-busy');
      fileInput.value = '';
    }
  };
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void handleFile(file);
  });
  for (const evt of ['dragenter', 'dragover']) {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    });
  }
  for (const evt of ['dragleave', 'drop']) {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.remove('is-over');
    });
  }
  drop.addEventListener('drop', (e) => {
    const file = (e as DragEvent).dataTransfer?.files?.[0];
    if (file) void handleFile(file);
  });
  // Dropping anywhere on the page should not navigate away from the app.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  const sampleButtons = SAMPLES.map((s) => {
    const b = h(
      'button',
      { class: 'sample', type: 'button', 'data-sample': s.id },
      h('span', { class: 'sample-name' }, s.name),
      h('span', { class: 'small' }, `${s.blurb}. Fictional sample.`),
    );
    b.addEventListener('click', () => onAnalyze(s.text, `${s.name} (fictional sample)`));
    return b;
  });

  return h(
    'div',
    { class: 'start' },
    h(
      'section',
      { class: 'hero' },
      h('p', { class: 'eyebrow' }, 'For first-time renters'),
      h('h1', { tabindex: '-1', id: 'view-title' }, 'Read your lease before you sign it.'),
      h(
        'p',
        { class: 'lede' },
        'Paste a rental lease and LeaseLens marks every risky clause where it sits, explains it in plain language, tells you what is normal, and drafts a polite message to negotiate it.',
      ),
      h(
        'p',
        { class: 'privacy' },
        h('strong', {}, 'Private by design. '),
        'The lease is checked inside this browser tab. Nothing is uploaded, there is no account, and no key is needed.',
      ),
      specimen(),
    ),
    h(
      'section',
      { class: 'input-card', 'aria-label': 'Add your lease' },
      h('label', { class: 'field-label', for: 'lease-text' }, 'Your lease'),
      h('p', { class: 'small', id: 'paste-help' }, 'Paste the text, or drop a PDF below.'),
      textarea,
      drop,
      fileInput,
      loading,
      alertBox,
      h('div', { class: 'row' }, checkBtn),
      h('div', { class: 'samples' }, h('p', { class: 'eyebrow' }, 'Just looking? Try a sample'), h('div', { class: 'sample-list' }, ...sampleButtons)),
      h('p', { class: 'disclaimer' }, DISCLAIMER),
    ),
  );
}
