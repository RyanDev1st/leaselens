import type { Rule, Severity } from '../types';
import { any, maxDollars } from './util';

export const livingRules: Rule[] = [
  {
    id: 'pet-fees',
    group: 'living',
    title: 'Pet fees or restrictions',
    detect: (s): Severity | null => {
      if (!/\b(pets?|animals?|dogs?|cats?)\b/i.test(s)) return null;
      if (
        /\b(service|assistance|emotional[- ]support|support) animals?\b[^.]{0,100}\b(exempt|not subject|no (fee|deposit)|not (be )?charged|are permitted|are allowed)\b/i.test(
          s,
        )
      )
        return null;
      const money = /\b(fee|deposit|pet rent|\$\s?\d|non-?refundable|per (month|pet))\b/i.test(s);
      const limits = /\b(prohibit\w*|not (be )?(allowed|permitted)|no pets|breed|weight|pounds?|lbs|written (consent|approval|permission)|restricted)\b/i.test(s);
      if (!money && !limits) return null;
      const refundableOnly = /refundable/i.test(s) && !/non-?\s?refundable|pet rent|per month|monthly/i.test(s);
      return money && !refundableOnly ? 'medium' : 'low';
    },
    explain: 'Pets bring extra charges (fees, deposits, monthly pet rent) or restrictions such as a ban, breed list or weight limit.',
    normal:
      'A refundable pet deposit and modest monthly pet rent are common. Assistance and service animals are generally exempt from pet fees and bans.',
    why: 'Costs repeat every month and non-refundable pet fees are rarely returned.',
    ask: 'Could any pet charge be refundable or one-time, and could you confirm that service or assistance animals are exempt from pet fees and restrictions?',
    question: 'What does a pet cost up front and monthly, and which of those amounts are refundable?',
  },
  {
    id: 'utilities-ambiguity',
    group: 'living',
    title: 'Unclear utilities and charges',
    detect: (s) => {
      if (!/\butilit(y|ies)\b/i.test(s)) return null;
      return any(
        s,
        /\b(as (determined|allocated|billed|calculated) by|at (the )?(landlord|lessor|owner)'?s? discretion|reasonably determined|pro-?\s?rat\w+|allocat\w+|a share of|shared|common (area|utilit\w+)|including,? but not limited to|and other (charges|utilities)|any (other )?utilit\w+|administrative|billing fee|service fee|overage)\b/i,
      )
        ? 'medium'
        : null;
    },
    explain:
      'It is not clear which utilities you pay, how shared bills are split, or whether extra billing fees apply, so your monthly cost is unpredictable.',
    normal:
      'Good leases name each utility, say who pays, and when shared meters are split, give the exact formula and show the bills.',
    why: 'The rent is only part of the cost; vague utility terms are a common source of surprise bills.',
    ask: 'Could the lease list each utility, who pays it, how any shared meter is split and the formula, and confirm there is no extra billing fee?',
    question: 'Which utilities are included in rent, and how are shared bills calculated and shown to me?',
  },
  {
    id: 'noise-parking-fines',
    group: 'living',
    title: 'Fines for noise and parking',
    detect: (s): Severity | null => {
      if (!/\b(noise|quiet hours|disturb\w*|parking|parked|towed|towing|vehicles?)\b/i.test(s)) return null;
      if (!/\b(fine[sd]?|\$\s?\d+|towed|towing|penalt\w+|per violation|per occurrence)\b/i.test(s)) return null;
      return maxDollars(s) >= 100 || /\b(per day|daily)\b/i.test(s) ? 'medium' : 'low';
    },
    explain: 'The lease sets fines or towing for noise and parking breaches, sometimes at the landlord’s discretion.',
    normal: 'Quiet hours and a parking policy are routine. Fines should be reasonable, stated up front and tied to written warnings.',
    why: 'Automatic fines get deducted from your deposit, and towing is costly and stressful.',
    ask: 'Could fines apply only after a written warning and be limited to a stated amount, and could you confirm the assigned parking spaces?',
    question: 'How are noise and parking complaints handled before a fine is charged?',
  },
];
