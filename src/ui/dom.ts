type Child = Node | string | null | undefined | false;

interface Props {
  class?: string;
  text?: string;
  on?: Record<string, (e: Event) => void>;
  [attr: string]: unknown;
}

/** Tiny element builder. Always uses textContent, so lease text can never become markup. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
    else if (key === 'on') {
      for (const [evt, fn] of Object.entries(value as Record<string, (e: Event) => void>)) el.addEventListener(evt, fn);
    } else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function smoothScroll(el: Element, block: ScrollLogicalPosition = 'center'): void {
  el.scrollIntoView({ block, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

let liveRegion: HTMLElement | null = null;

/** Announces a short status message to screen readers and shows it briefly on screen. */
export function announce(message: string): void {
  if (!liveRegion) {
    liveRegion = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(liveRegion);
  }
  const region = liveRegion;
  region.textContent = message;
  region.classList.add('is-visible');
  window.setTimeout(() => {
    if (region.textContent === message) region.classList.remove('is-visible');
  }, 2600);
}
