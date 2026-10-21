import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import { SAMPLES } from '../src/samples';

describe('samples', () => {
  it('analysis is deterministic', () => {
    for (const s of SAMPLES) {
      expect(analyze(s.text)).toEqual(analyze(s.text));
    }
  });

  it('student apartment is very high risk and hits most rules', () => {
    const a = analyze(SAMPLES[0].text);
    const ruleIds = new Set(a.findings.map((f) => f.ruleId));
    expect(ruleIds.size).toBeGreaterThanOrEqual(22);
    expect(a.band).toBe('Very high');
    expect(a.counts.high).toBeGreaterThanOrEqual(8);
  });

  it('shared house is clearly lower risk than the student apartment', () => {
    const a = analyze(SAMPLES[0].text);
    const b = analyze(SAMPLES[1].text);
    expect(b.score).toBeLessThan(a.score);
    expect(['Lower', 'Moderate']).toContain(b.band);
  });

  it('shared house flags only the few things worth checking', () => {
    const b = analyze(SAMPLES[1].text);
    expect(b.findings.map((f) => f.ruleId).sort()).toEqual(['joint-and-several', 'late-fees', 'non-refundable-fees', 'pet-fees'].sort());
  });

  it('snapshot of stable results', () => {
    const summary = SAMPLES.map((s) => {
      const a = analyze(s.text);
      return { id: s.id, score: a.score, band: a.band, counts: a.counts, rules: a.findings.length };
    });
    expect(summary).toMatchSnapshot();
  });
});
