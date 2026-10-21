import { announce, h } from './dom';

/** Copies text. Returns true on success; on failure the caller shows a manual fallback. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = h('textarea', { 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;left:-9999px;top:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy with feedback. If the browser blocks the clipboard, a selectable textarea
 * is revealed inside `fallbackHost` so the user can copy by hand.
 */
export async function copyWithFeedback(text: string, label: string, fallbackHost: HTMLElement): Promise<void> {
  if (await copyText(text)) {
    announce(`${label} copied`);
    return;
  }
  let box = fallbackHost.querySelector<HTMLTextAreaElement>('textarea.manual-copy');
  if (!box) {
    box = h('textarea', {
      class: 'manual-copy',
      readonly: true,
      rows: 8,
      'aria-label': `${label}: select and copy`,
    });
    fallbackHost.append(h('p', { class: 'small' }, 'Your browser blocked copying. Select the text below and copy it by hand.'), box);
  }
  box.value = text;
  box.focus();
  box.select();
  announce('Copy was blocked; text selected for manual copy');
}
