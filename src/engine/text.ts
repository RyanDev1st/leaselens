import type { Sentence } from './types';

const ABBREVIATIONS = [
  'no', 'nos', 'inc', 'ltd', 'llc', 'st', 'mr', 'mrs', 'ms', 'dr', 'e.g', 'i.e', 'etc', 'sec', 'approx',
  'apt', 'vs', 'ave', 'blvd', 'dept', 'est', 'fig', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug',
  'sep', 'sept', 'oct', 'nov', 'dec',
];

function endsWithAbbreviation(chunk: string): boolean {
  const m = /([A-Za-z.]+)\.$/.exec(chunk);
  if (!m) return false;
  const word = m[1].toLowerCase().replace(/\.$/, '');
  if (/^[a-z]$/.test(word)) return true; // single initial, e.g. "A."
  return ABBREVIATIONS.includes(word);
}

/**
 * Splits lease text into sentences, keeping character offsets into the
 * original string. Line breaks always end a sentence, so headings and
 * numbered clauses stay separate.
 */
export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  let lineStart = 0;
  const lines = text.split('\n');
  for (const line of lines) {
    pushLine(line, lineStart, out);
    lineStart += line.length + 1;
  }
  return out;
}

function pushLine(line: string, offset: number, out: Sentence[]): void {
  if (!line.trim()) return;
  if (isHeading(line)) {
    const lead = line.length - line.trimStart().length;
    out.push({ start: offset + lead, end: offset + lead + line.trim().length, text: line.trim(), heading: true });
    return;
  }
  const boundary = /[.!?]+["')\]]*\s+(?=[A-Z0-9"'(\[])/g;
  let segStart = 0;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(line)) !== null) {
    const endIdx = m.index + m[0].replace(/\s+$/, '').length;
    const chunk = line.slice(segStart, endIdx);
    if (endsWithAbbreviation(chunk)) continue;
    // A numbered heading such as "12. Late fee." splits after the number: keep it with its text.
    if (/^\s*(\d+|[A-Za-z])\.$/.test(chunk)) continue;
    emit(line, segStart, endIdx, offset, out);
    segStart = m.index + m[0].length;
  }
  emit(line, segStart, line.length, offset, out);
}

function emit(line: string, from: number, to: number, offset: number, out: Sentence[]): void {
  let s = from;
  let e = to;
  while (s < e && /\s/.test(line[s])) s++;
  while (e > s && /\s/.test(line[e - 1])) e--;
  if (e <= s) return;
  out.push({ start: offset + s, end: offset + e, text: line.slice(s, e) });
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twelve: 12, fifteen: 15, twenty: 20, thirty: 30, 'forty-five': 45, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, 'one hundred twenty': 120, 'one hundred': 100,
};

/** Parses "60", "sixty (60)", "ninety" etc. into a number, or null. */
export function parseCount(raw: string): number | null {
  const digits = /\d+/.exec(raw);
  if (digits) return parseInt(digits[0], 10);
  const key = raw.trim().toLowerCase();
  return key in NUMBER_WORDS ? NUMBER_WORDS[key] : null;
}

const COUNT = String.raw`(\d+|one hundred twenty|one hundred|forty-five|[a-z]+)\s*(?:\((\d+)\)\s*)?`;

/** Finds counts of days/hours in a sentence, e.g. "sixty (60) days". */
export function findDurations(text: string, unit: 'days' | 'hours'): number[] {
  const re = new RegExp(COUNT + (unit === 'days' ? "(?:consecutive |business |calendar )?(?:days?|nights?)" : 'hours?'), 'gi');
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = m[2] ? parseInt(m[2], 10) : parseCount(m[1]);
    if (n !== null) out.push(n);
  }
  return out;
}

/**
 * A heading is a whole line with no sentence punctuation, such as "3. Automatic Renewal".
 * Headings are shown as titles and are never analysed as clauses.
 */
export function isHeading(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 70) return false;
  if (/[.!?;:]$/.test(t.replace(/^\d+\.\s*/, '')) ) return false;
  return /^(\d+[.)]\s*|[A-Z]\.\s*|(article|section)\s+\d+[.:]?\s*)?[A-Z][^.!?;]*$/.test(t) && t.split(/\s+/).length <= 9;
}
