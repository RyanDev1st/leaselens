import { describe, expect, it } from 'vitest';
import { RULES } from '../src/engine/rules';
import { analyze } from '../src/engine/analyze';

interface Case {
  id: string;
  positive: string;
  negative: string;
  severity?: 'high' | 'medium' | 'low';
}

const CASES: Case[] = [
  {
    id: 'auto-renewal',
    positive:
      'This lease will automatically renew for another twelve months unless Tenant gives written notice at least sixty (60) days before the end of the term.',
    negative: 'This lease does not automatically renew and ends on the last day of the term.',
    severity: 'high',
  },
  {
    id: 'early-termination',
    positive: 'If Tenant ends this lease early, Tenant shall pay an early termination fee equal to three months of rent.',
    negative: 'Tenant may end the lease early by giving thirty days of written notice, with no fee.',
  },
  {
    id: 'relet-liability',
    positive:
      'Tenant remains liable for rent until the unit is re-let, and Landlord has no duty to mitigate or re-rent the unit.',
    negative: 'Landlord will use reasonable efforts to re-let the unit if Tenant leaves early.',
  },
  {
    id: 'holdover',
    positive: 'If Tenant holds over after the end of the term, rent will be double the monthly rent, charged per day.',
    negative: 'Rent is due on the first day of each month by bank transfer.',
  },
  {
    id: 'long-notice',
    positive: 'Tenant must give ninety (90) days written notice before moving out of the apartment.',
    negative: 'Tenant must give thirty days written notice before moving out of the apartment.',
  },
  {
    id: 'unilateral-changes',
    positive: 'Landlord reserves the right to modify the house rules and policies at any time.',
    negative: 'This lease may only be amended in a writing signed by both parties.',
  },
  {
    id: 'non-refundable-fees',
    positive: 'Tenant pays a non-refundable move-in fee of $350 at signing.',
    negative: 'The security deposit is fully refundable at the end of the tenancy.',
    severity: 'high',
  },
  {
    id: 'deposit-deductions',
    positive:
      "Landlord may deduct from the security deposit any and all costs Landlord determines in its sole discretion, without itemization.",
    negative:
      'Landlord may deduct from the deposit only unpaid rent and damage other than normal wear and tear, with an itemized statement.',
  },
  {
    id: 'deposit-return-missing',
    positive: 'The deposit will be returned after Landlord inspects the unit and decides the final amount owed.',
    negative: 'The deposit will be returned within 21 days after Tenant moves out.',
  },
  {
    id: 'late-fees',
    positive: 'If rent is not received by the 3rd, a late fee of $25 per day will be charged until paid.',
    negative: 'Rent is due on the first day of each month.',
    severity: 'high',
  },
  {
    id: 'rent-increase',
    positive: 'Landlord may increase the rent at any time during the term with 30 days written notice.',
    negative: 'Rent is fixed for the full term of this lease and cannot be increased before it ends.',
  },
  {
    id: 'move-out-cleaning',
    positive: 'A flat cleaning fee of $250 will be deducted from the deposit regardless of the condition of the unit.',
    negative: 'Tenant shall leave the unit broom-clean at move-out.',
  },
  {
    id: 'landlord-entry',
    positive: 'Landlord may enter the unit at any time without notice to inspect or show the apartment.',
    negative:
      'Landlord will give at least 24 hours written notice before entering, except in an emergency.',
  },
  {
    id: 'self-help-lockout',
    positive: 'If rent is late, Landlord may change the locks and remove Tenant’s belongings from the unit.',
    negative: 'Tenant must not change the locks without Landlord’s written consent.',
  },
  {
    id: 'guest-limits',
    positive: 'Guests may not stay more than 3 nights in any 30-day period without Landlord’s written consent.',
    negative: 'Tenant may host guests whenever they like.',
  },
  {
    id: 'subletting-ban',
    positive: 'Tenant shall not sublet the unit or list it on Airbnb.',
    negative: 'Tenant may sublet with Landlord’s consent, which will not be unreasonably withheld.',
  },
  {
    id: 'repairs-on-tenant',
    positive: 'Tenant shall be responsible for all repairs, including plumbing, heating and appliances, regardless of cause.',
    negative: 'Tenant is responsible for replacing light bulbs and smoke detector batteries.',
    severity: 'high',
  },
  {
    id: 'joint-and-several',
    positive: 'All tenants are jointly and severally liable for the full rent and any damage.',
    negative: 'Each tenant is responsible only for their own share of the rent.',
  },
  {
    id: 'waiver-of-rights',
    positive: 'Tenant waives the right to a jury trial and any claim relating to habitability.',
    negative: 'Landlord does not waive any rights by accepting late rent.',
  },
  {
    id: 'attorney-fees',
    positive: 'Tenant shall pay all of Landlord’s attorney’s fees incurred in enforcing this lease, whether or not suit is filed.',
    negative: 'The prevailing party in any dispute will recover reasonable attorney fees.',
  },
  {
    id: 'landlord-liability-waiver',
    positive: 'Landlord shall not be liable for any injury, theft or damage to Tenant’s property for any reason.',
    negative: 'Landlord is not liable for damage to belongings except where caused by Landlord’s negligence.',
  },
  {
    id: 'mold-pest-disclaimer',
    positive: 'Landlord disclaims all liability for mold, and Tenant is responsible for the cost of pest control.',
    negative: 'Landlord will arrange pest treatment at its own cost within five days of a report.',
  },
  {
    id: 'insurance-requirement',
    positive:
      'Tenant must maintain renters insurance with liability coverage of at least $300,000 naming Landlord as additional insured.',
    negative: 'Tenant is encouraged but not required to carry renters insurance.',
    severity: 'medium',
  },
  {
    id: 'pet-fees',
    positive: 'A non-refundable pet fee of $300 and $35 monthly pet rent apply to each dog or cat.',
    negative: 'The apartment is two blocks from a dog park.',
  },
  {
    id: 'utilities-ambiguity',
    positive: 'Tenant shall pay a share of utilities as reasonably determined by Landlord, plus an administrative billing fee.',
    negative: 'Landlord pays water and trash; Tenant pays electricity and internet directly to the providers.',
  },
  {
    id: 'noise-parking-fines',
    positive: 'Vehicles parked in unassigned spaces will be towed at owner’s expense and Tenant will be fined $75 per violation.',
    negative: 'Quiet hours are from 10 pm to 7 am.',
  },
];

function ids(text: string): string[] {
  return analyze(text).findings.map((f) => f.ruleId);
}

describe('clause catalogue', () => {
  it('has 26 rules with complete copy', () => {
    expect(RULES).toHaveLength(26);
    expect(new Set(RULES.map((r) => r.id)).size).toBe(26);
    for (const r of RULES) {
      for (const key of ['title', 'explain', 'normal', 'why', 'ask', 'question'] as const) {
        expect(r[key].length, `${r.id}.${key}`).toBeGreaterThan(key === 'title' ? 8 : 20);
      }
    }
  });

  it('has a positive and negative case for every rule', () => {
    expect(CASES.map((c) => c.id).sort()).toEqual(RULES.map((r) => r.id).sort());
  });

  for (const c of CASES) {
    describe(c.id, () => {
      it('flags the risky sentence', () => {
        const found = analyze(c.positive).findings.filter((f) => f.ruleId === c.id);
        expect(found.length).toBe(1);
        if (c.severity) expect(found[0].severity).toBe(c.severity);
      });
      it('does not flag the fair sentence', () => {
        expect(ids(c.negative)).not.toContain(c.id);
      });
    });
  }
});
