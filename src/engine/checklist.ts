import type { Analysis, Finding } from './types';

export const UNIVERSAL_QUESTIONS = [
  'Can I photograph or video the unit at move-in and send you a dated condition report, and will you sign it?',
  'Will every payment (rent, deposit, fees) get a written receipt or appear in an online ledger?',
  'Who do I contact for an emergency repair, day or night, and what is the expected response time?',
];

export interface ChecklistItem {
  question: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
}

export function checklistItems(findings: Finding[]): ChecklistItem[] {
  const seen = new Set<string>();
  const items: ChecklistItem[] = [];
  for (const f of findings) {
    if (seen.has(f.ruleId)) continue;
    seen.add(f.ruleId);
    items.push({ question: f.question, title: f.title, severity: f.severity });
  }
  return items;
}

export const DISCLAIMER =
  'LeaseLens is informational and is not legal advice. It is a first-pass reading using fixed rules; it can miss things and flag things that are fine. For legal questions, ask a tenant union, legal aid or a lawyer.';

export function checklistMarkdown(analysis: Analysis): string {
  const items = checklistItems(analysis.findings);
  const lines = ['# Questions to ask before signing', '', `Risk score: ${analysis.score} of 100 (${analysis.band})`, ''];
  for (const sev of ['high', 'medium', 'low'] as const) {
    const group = items.filter((i) => i.severity === sev);
    if (!group.length) continue;
    lines.push(`## ${sev[0].toUpperCase() + sev.slice(1)} priority`, '');
    for (const i of group) lines.push(`- [ ] ${i.question} (${i.title})`);
    lines.push('');
  }
  lines.push('## Always ask', '');
  for (const q of UNIVERSAL_QUESTIONS) lines.push(`- [ ] ${q}`);
  lines.push('', '---', DISCLAIMER, '');
  return lines.join('\n');
}
