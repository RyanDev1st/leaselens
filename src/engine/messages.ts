import type { Finding } from './types';

export function snippet(sentence: string, max = 110): string {
  const flat = sentence.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : flat.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** A complete, polite message about one clause. */
export function buildMessage(ask: string, sentence: string): string {
  return [
    "Hi [Landlord's name],",
    '',
    'Thank you for sending the lease. Before I sign, I would like to ask about the clause that says: "' +
      snippet(sentence) +
      '"',
    '',
    ask,
    '',
    'I would like to move forward and would appreciate your thoughts. Thank you,',
    '[Your name]',
  ].join('\n');
}

/** One email covering every high and medium finding. */
export function buildCombinedMessage(findings: Finding[]): string {
  const chosen = findings.filter((f) => f.severity !== 'low');
  if (chosen.length === 0) return '';
  const lines = [
    "Hi [Landlord's name],",
    '',
    'Thank you for sending the lease. I have read it carefully and would like to talk through a few points before I sign:',
    '',
  ];
  chosen.forEach((f, i) => {
    lines.push(`${i + 1}. ${f.title}. The clause says: "${snippet(f.sentence, 90)}"`);
    lines.push(`   ${f.ask}`);
    lines.push('');
  });
  lines.push('I would like to move forward and would appreciate your thoughts. Thank you,', '[Your name]');
  return lines.join('\n');
}
