import type { Rule } from '../types';
import { any, all, maxPercent, maxDollars } from './util';

const DEPOSIT_DEADLINE =
  /deposit[^.]{0,200}within\s+[a-z0-9-]+\s*(\(\d+\)\s*)?(business\s+|calendar\s+)?days|within\s+[a-z0-9-]+\s*(\(\d+\)\s*)?(business\s+|calendar\s+)?days[^.]{0,120}deposit/i;

export const moneyRules: Rule[] = [
  {
    id: 'non-refundable-fees',
    group: 'money',
    title: 'Non-refundable fees',
    detect: (s) => {
      if (!/\bnon-?\s?refundable\b/i.test(s)) return null;
      if (!/\b(fee|deposit|payment|charge|cleaning|admin\w*|move-?in|holding)\b/i.test(s)) return null;
      if (/\bapplication fee\b/i.test(s) && !/\b(deposit|move-?in|cleaning|admin\w*|pet)\b/i.test(s)) return 'low';
      return 'high';
    },
    explain:
      'A fee or part of your deposit is described as non-refundable, so you will not get it back even if you leave the unit spotless.',
    normal:
      'Application screening fees are usually non-refundable. Security deposits are normally refundable, and many places restrict "non-refundable deposits" or extra move-in fees.',
    why: 'Non-refundable charges are often disguised deposits that reduce what you get back on move-out.',
    ask: 'Could you explain what the non-refundable fee pays for, and would you be open to making it refundable or reducing it, or itemizing it in the lease?',
    question: 'Which of the amounts I pay up front are refundable, and which are not?',
  },
  {
    id: 'deposit-deductions',
    group: 'money',
    title: 'Broad deposit deductions',
    detect: (s) =>
      all(s, /\bdeposit\b/i, /\b(deduct\w*|withhold\w*|retain\w*|keep|apply|applied|forfeit\w*)\b/i) &&
      any(
        s,
        /\b(any and all|all costs|any costs|any damage|all damage|sole (and absolute )?discretion|including,? but not limited to|without (itemi[sz]\w+|accounting|notice)|normal wear and tear)\b/i,
      ) &&
      !/\b(other than|except for|excluding|not (be )?deduct\w*[^.]{0,30}wear)\b/i.test(s)
        ? 'high'
        : null,
    explain:
      'The landlord can take money out of your deposit for very broad reasons, with wide discretion and no promise to show you what each charge was for.',
    normal:
      'Deductions are normally limited to unpaid rent and damage beyond normal wear and tear, with an itemized list and receipts.',
    why: 'The deposit is often the largest sum you hand over; vague deduction rights make it easy to lose.',
    ask: 'Could the lease say deductions are limited to unpaid rent and damage beyond normal wear and tear, backed by an itemized statement and receipts?',
    question: 'What can be deducted from my deposit, and will I get an itemized list with proof?',
  },
  {
    id: 'deposit-return-missing',
    group: 'money',
    title: 'No deadline to return the deposit',
    detect: (s, ctx) => {
      if (!/\bdeposit\b/i.test(s)) return null;
      if (!/\b(return\w*|refund\w*|repay\w*|give\w* back)\b/i.test(s)) return null;
      if (/\b(within|no later than|not later than|by)\b[^.]{0,30}\b(days|business days)\b/i.test(s)) return null;
      if (DEPOSIT_DEADLINE.test(ctx.fullText)) return null;
      if (/\b(non-?refundable)\b/i.test(s)) return null;
      return 'medium';
    },
    explain: 'The lease says the deposit will be returned but gives no firm date, so the landlord can take as long as they like.',
    normal: 'Most places set a deadline, usually 14 to 30 days after move-out, along with an itemized statement.',
    why: 'Without a date it is harder to claim what you are owed, and your next deposit may be tied up meanwhile.',
    ask: 'Could we add that the deposit, with an itemized statement of any deductions, will be returned within 30 days of move-out?',
    question: 'By what date will I get my deposit back after I move out?',
  },
  {
    id: 'late-fees',
    group: 'money',
    title: 'Late fees',
    detect: (s) => {
      const late =
        /\blate (fee|charge|penalty|payment fee)s?\b/i.test(s) ||
        /\b(rent|payment)\b[^.]{0,40}\b(not (paid|received)|is late|unpaid|overdue|past due|after the \w+ (day|of the month))\b[^.]{0,80}(\$|%|percent|fee|penalty|interest|per day|daily)/i.test(
          s,
        );
      if (!late) return null;
      if (/\bno late (fee|charge|penalty)\b|\bnot (be )?charged?\b|\bwaive\w*[^.]{0,20}late\b/i.test(s)) return null;
      const harsh =
        /\b(per day|daily|each day|every day|compound\w*|plus interest|(each|every|for each) (additional|extra|subsequent) day|per week|weekly)\b/i.test(s) ||
        maxPercent(s) >= 10;
      if (harsh) return 'high';
      return maxDollars(s) > 0 && maxDollars(s) <= 75 ? 'low' : 'medium';
    },
    explain:
      'You pay an extra charge if rent is late. Charges that grow every day, or are a large percentage of rent, add up fast.',
    normal:
      'A one-time fee of about 5% of monthly rent after a grace period of three to five days is common. Many places cap late fees by law.',
    why: 'A late payment on a tight student budget can snowball when the fee repeats or compounds.',
    ask: 'Could the late fee be a single flat amount of no more than 5% of monthly rent, charged only after a grace period of five days, and not repeat or compound?',
    question: 'How long is the grace period, and exactly how is the late fee calculated?',
  },
  {
    id: 'rent-increase',
    group: 'money',
    title: 'Rent can rise mid-term',
    detect: (s) => {
      if (/\b(not|no|never)\b[^.]{0,30}\b(increase|raise|adjust)\w*\b/i.test(s)) return null;
      if (/\brent\b[^.]{0,30}\b(is|shall remain|will remain|remains)\b[^.]{0,20}\bfixed\b/i.test(s)) return null;
      const increase =
        /\b(increase|raise|adjust|change|escalat\w+)\w*\b[^.]{0,40}\b(the )?(monthly )?rent\b/i.test(s) ||
        /\brent\b[^.]{0,30}\b(may|shall|will|can)\b[^.]{0,20}\b(be )?(increased|raised|adjusted|changed)\b/i.test(s);
      if (!increase) return null;
      return any(
        s,
        /\b(during|any time|at any time|anytime|mid-?term|upon \d+|with \d+ days'? notice|sole discretion|at (the )?(landlord|lessor)'?s? (option|discretion)|from time to time|at will)\b/i,
      )
        ? 'high'
        : 'medium';
    },
    explain: 'The landlord can raise the rent while your lease is still running.',
    normal:
      'During a fixed term the rent is normally locked. Increases usually apply only when the term ends and a renewal starts, with written notice.',
    why: 'Your budget is built on the rent you agreed to; a mid-term increase breaks that agreement.',
    ask: 'Could the lease state that rent stays fixed for the entire term and any change applies only to a renewal, with at least 60 days of written notice?',
    question: 'Is my rent guaranteed not to change until the lease ends?',
  },
  {
    id: 'move-out-cleaning',
    group: 'money',
    title: 'Move-out cleaning charge',
    detect: (s) => {
      if (!/\bclean(ing|ed)?\b/i.test(s)) return null;
      if (!/\b(fee|charge|deduct\w*|cost|bill\w*)\b/i.test(s)) return null;
      return any(s, /\b(flat|mandatory|regardless|whether or not|professional\w*|carpet|steam|\$\s?\d)/i) ? 'medium' : null;
    },
    explain:
      'You are charged for cleaning when you leave, often a flat or professional-cleaning fee that applies even if you cleaned the unit yourself.',
    normal:
      'Landlords can charge for cleaning beyond normal wear and tear, based on actual cost. Flat mandatory fees regardless of condition are often challenged.',
    why: 'A flat charge is almost guaranteed to be deducted, so treat it as a hidden cost of renting.',
    ask: 'Could the cleaning charge apply only if the unit is left dirty beyond normal wear and tear, and be based on actual receipts?',
    question: 'If I leave the unit clean, can I avoid the cleaning charge?',
  },
];
