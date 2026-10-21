import { describe, expect, it } from 'vitest';
import { splitSentences, isHeading, findDurations, parseCount } from '../src/engine/text';
import { analyze } from '../src/engine/analyze';
import { bandFor, scoreFor, summarize, countBySeverity } from '../src/engine/score';
import { buildCombinedMessage, buildMessage, snippet } from '../src/engine/messages';
import { checklistItems, checklistMarkdown, UNIVERSAL_QUESTIONS } from '../src/engine/checklist';
import { reflow } from '../src/pdf/reflow';

describe('sentence splitter', () => {
  it('keeps offsets into the original text', () => {
    const text = 'Rent is due on the 1st. Late fees apply after the 5th.\n2. Deposit\nThe deposit is $500.';
    for (const s of splitSentences(text)) expect(text.slice(s.start, s.end)).toBe(s.text);
  });

  it('does not split on abbreviations, decimals or numbered clauses', () => {
    const s = splitSentences('Pay $1.50 per day, e.g. for parking. See Sec. 4 for details. 12. Late fee. Tenant shall pay.');
    expect(s.map((x) => x.text)).toEqual(['Pay $1.50 per day, e.g. for parking.', 'See Sec. 4 for details.', '12. Late fee.', 'Tenant shall pay.']);
  });

  it('marks title lines as headings and never analyses them', () => {
    expect(isHeading('3. Automatic Renewal')).toBe(true);
    expect(isHeading('RESIDENTIAL LEASE AGREEMENT')).toBe(true);
    expect(isHeading('Tenant shall pay rent on the first day.')).toBe(false);
    expect(analyze('3. Automatic Renewal\n').findings).toHaveLength(0);
  });

  it('reads number words and parenthetical numbers', () => {
    expect(parseCount('sixty')).toBe(60);
    expect(findDurations('at least sixty (60) days notice', 'days')).toEqual([60]);
    expect(findDurations('give 24 hours notice', 'hours')).toEqual([24]);
    expect(findDurations('fourteen (14) consecutive nights', 'days')).toEqual([14]);
  });
});

describe('analyze', () => {
  it('flags a sentence once per rule and merges highlights per sentence', () => {
    const a = analyze('Landlord may enter at any time without notice and may change the locks if rent is late and Tenant shall pay all repairs.');
    expect(a.highlights).toHaveLength(1);
    expect(a.highlights[0].findingIds.length).toBeGreaterThan(1);
    expect(a.highlights[0].severity).toBe('high');
  });

  it('highlights point at the exact sentence in the original text', () => {
    const text = 'Welcome to your new home.\nThe lease will automatically renew for twelve months unless notice is given 60 days before the end.\nEnjoy.';
    const a = analyze(text);
    const hl = a.highlights[0];
    expect(text.slice(hl.start, hl.end)).toContain('automatically renew');
  });

  it('works with typographic quotes and Windows line breaks', () => {
    const a = analyze('Tenant shall pay all of Landlord’s attorney’s fees.\r\nGuests may not stay more than 3 nights.');
    expect(a.findings.map((f) => f.ruleId).sort()).toEqual(['attorney-fees', 'guest-limits']);
  });

  it('returns an honest empty result for a clean lease', () => {
    const a = analyze('The tenant pays rent monthly. The landlord keeps the building in good repair and gives notice before entering.');
    expect(a.findings).toHaveLength(0);
    expect(a.score).toBe(0);
    expect(a.summary).toMatch(/not a guarantee/);
  });

  it('orders findings from most to least serious', () => {
    const a = analyze(
      'Quiet hours are enforced with a $20 fine per violation. Landlord may enter at any time without notice. Tenant shall pay a share of utilities as reasonably determined by Landlord.',
    );
    const sev = a.findings.map((f) => f.severity);
    expect(sev).toEqual([...sev].sort((x, y) => ({ high: 0, medium: 1, low: 2 })[x] - ({ high: 0, medium: 1, low: 2 })[y]));
  });
});

describe('score', () => {
  it('is monotonic, bounded and banded', () => {
    expect(scoreFor({ high: 0, medium: 0, low: 0 })).toBe(0);
    expect(scoreFor({ high: 1, medium: 0, low: 0 })).toBeLessThan(scoreFor({ high: 2, medium: 0, low: 0 }));
    expect(scoreFor({ high: 500, medium: 0, low: 0 })).toBeLessThanOrEqual(100);
    expect(bandFor(10)).toBe('Lower');
    expect(bandFor(30)).toBe('Moderate');
    expect(bandFor(60)).toBe('High');
    expect(bandFor(90)).toBe('Very high');
  });

  it('summary names the top concerns', () => {
    const a = analyze('Landlord may enter at any time without notice. The lease will automatically renew unless notice is given 90 days before the end.');
    expect(summarize(a.findings, countBySeverity(a.findings))).toMatch(/Start with/);
  });
});

describe('messages and checklist', () => {
  const a = analyze('Landlord may enter at any time without notice. Tenant shall pay a share of utilities as reasonably determined by Landlord.');

  it('message is polite, quotes the clause and has placeholders', () => {
    const m = a.findings[0].message;
    expect(m).toContain("Hi [Landlord's name]");
    expect(m).toContain('[Your name]');
    expect(m).toContain('enter at any time');
    expect(m.toLowerCase()).toContain('could');
  });

  it('snippet shortens long text on a word boundary', () => {
    const long = 'word '.repeat(60);
    expect(snippet(long, 40).length).toBeLessThanOrEqual(40);
    expect(snippet('short text')).toBe('short text');
  });

  it('combined message includes high and medium findings only', () => {
    const text = buildCombinedMessage(a.findings);
    expect(text).toContain('1.');
    expect(buildCombinedMessage([])).toBe('');
    expect(buildMessage('Could we change this?', 'Some clause.')).toContain('Some clause.');
  });

  it('checklist has one question per rule plus the universal questions', () => {
    const items = checklistItems(a.findings);
    expect(items.length).toBe(new Set(a.findings.map((f) => f.ruleId)).size);
    const md = checklistMarkdown(a);
    for (const q of UNIVERSAL_QUESTIONS) expect(md).toContain(q);
    expect(md).toContain('not legal advice');
  });
});

describe('reflow', () => {
  it('joins hard-wrapped lines but keeps headings and numbered clauses', () => {
    const raw = '3. Automatic Renewal\nAt the end of the term this lease will\nautomatically renew for twelve months.\n4. Rent\nRent is $900.';
    expect(reflow(raw)).toBe(
      '3. Automatic Renewal\nAt the end of the term this lease will automatically renew for twelve months.\n4. Rent\nRent is $900.',
    );
  });

  it('joins words split by a hyphen at a line end', () => {
    expect(reflow('The Tenant shall pay for any dam-\nage caused.')).toBe('The Tenant shall pay for any damage caused.');
  });
});
