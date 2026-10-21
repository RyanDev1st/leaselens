/**
 * Text pasted from a PDF, or extracted from one, is hard-wrapped at the page width.
 * This joins wrapped lines back into sentences while keeping headings and numbered
 * clauses on their own lines.
 */
export function reflow(raw: string): string {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/[ \t]+$/g, ''));
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }
    const prev = out.length ? out[out.length - 1] : '';
    if (prev && continues(prev, trimmed)) {
      out[out.length - 1] = prev.replace(/-$/, '') + (prev.endsWith('-') ? '' : ' ') + trimmed;
    } else {
      out.push(trimmed);
    }
  }
  // Collapse runs of blank lines.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function continues(prev: string, next: string): boolean {
  if (/[.!?:;]["')\]]*$/.test(prev)) return false;
  if (/^(\d+[.)]|[A-Za-z][.)]|\([a-z0-9]{1,4}\)|article\b|section\b)\s/i.test(next)) return false;
  if (/^[a-z(]/.test(next)) return true;
  if (/[,\-–]$/.test(prev)) return true;
  return false;
}
