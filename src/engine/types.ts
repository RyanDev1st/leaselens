export type Severity = 'high' | 'medium' | 'low';

export interface Sentence {
  start: number;
  end: number;
  text: string;
  /** True for title lines such as "3. Late Fees"; these are never analysed. */
  heading?: boolean;
}

export interface RuleContext {
  /** Full lease text, for rules that need document-level evidence. */
  fullText: string;
}

export interface RuleCopy {
  /** Plain-language explanation of what the clause does to the renter. */
  explain: string;
  /** What is usual in a fair residential lease. */
  normal: string;
  /** Why it matters in practice. */
  why: string;
  /** One or two polite first-person sentences asking for a change. */
  ask: string;
  /** Question to put to the landlord before signing. */
  question: string;
}

export interface Rule extends RuleCopy {
  id: string;
  title: string;
  group: 'term' | 'money' | 'access' | 'liability' | 'living';
  /** Returns the severity if the sentence is flagged, otherwise null. */
  detect: (sentence: string, ctx: RuleContext) => Severity | null;
}

export interface Finding extends RuleCopy {
  id: string;
  ruleId: string;
  title: string;
  severity: Severity;
  start: number;
  end: number;
  sentence: string;
  /** Ready-to-send message for this clause alone. */
  message: string;
}

export interface Highlight {
  start: number;
  end: number;
  severity: Severity;
  findingIds: string[];
}

export type Band = 'Lower' | 'Moderate' | 'High' | 'Very high';

export interface Analysis {
  text: string;
  findings: Finding[];
  highlights: Highlight[];
  score: number;
  band: Band;
  counts: Record<Severity, number>;
  summary: string;
}
