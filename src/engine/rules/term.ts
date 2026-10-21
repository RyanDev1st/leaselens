import type { Rule } from '../types';
import { any, all, maxDays } from './util';

export const termRules: Rule[] = [
  {
    id: 'auto-renewal',
    group: 'term',
    title: 'Automatic renewal',
    detect: (s) => {
      const renews =
        /\bautomatic(ally)?\b[^.]{0,40}\b(renew\w*|extend\w*|continu\w*|roll\w* over|convert\w*)\b/i.test(s) ||
        /\b(renew\w*|extend\w*|roll\w* over|convert\w*)\b[^.]{0,40}\bautomatic(ally)?\b/i.test(s) ||
        /\b(shall|will|is deemed to|are deemed to)\s+(automatically\s+)?(renew|roll over)\b/i.test(s) ||
        /\bunless\b[^.]{0,80}\b(notice|notifies|notify)\b[^.]{0,80}\b(renew\w*|extend\w*)\b/i.test(s);
      if (!renews) return null;
      if (
        /\b(does|do|will|shall) not (automatically )?(renew|extend|roll over)\b|\bno automatic (renewal|extension)\b|\bnot automatically\b/i.test(
          s,
        )
      )
        return null;
      return maxDays(s) >= 60 ? 'high' : 'medium';
    },
    explain:
      'The lease renews on its own unless you send written notice by a deadline. If you miss the deadline you can be locked into another full term, or into a higher rent.',
    normal:
      'Many leases convert to month-to-month at the end of the term instead of renewing for a full year. A reminder from the landlord and a 30-day window are common.',
    why: 'Students and people who may move for work often forget a notice date that is buried months earlier in the lease.',
    ask: 'Could the lease convert to month-to-month at the end of the term instead of renewing for a full term, or at least require a written reminder from you 30 days before the deadline, with a notice window of no more than 30 days?',
    question: 'What exactly happens at the end of the term, and by what date must I give written notice to leave?',
  },
  {
    id: 'early-termination',
    group: 'term',
    title: 'Early termination penalty',
    detect: (s) => {
      const early =
        /\bearly terminat\w+|\bterminat\w+[^.]{0,20}\bearly\b|\bbreak\w*\s+(the|this|your)\s+(lease|agreement)|\b(leav\w+|vacat\w+|move\w* out)\b[^.]{0,40}\bbefore (the )?(end|expiration|expiry)\b|\bbefore the (end|expiration) of (the|this) (lease|term)\b/i.test(
          s,
        );
      const penalty =
        /\b(fee|penalty|penalt\w+|charge|liquidated|forfeit\w*|remaining rent|balance of (the )?(rent|term)|rent for the (remainder|rest)|(two|three|2|3) months'? rent|entire (remaining )?rent)\b/i.test(
          s,
        );
      if (!early || !penalty) return null;
      if (/\b(no|without)\b[^.]{0,20}\b(fee|penalty|charge)\b/i.test(s)) return null;
      return 'high';
    },
    explain:
      'If you need to leave before the lease ends, you owe a fee or all of the remaining rent. This can run to thousands of dollars.',
    normal:
      'A fee of one to two months of rent, or rent until a replacement tenant is found, is common. Owing every remaining month is not.',
    why: 'Jobs, studies and family situations change; an exit price you cannot afford effectively traps you.',
    ask: 'Could we cap the early termination cost at a fixed amount, for example one month of rent, with 30 days of notice, and have it end once a replacement tenant begins paying rent?',
    question: 'If I have to leave early, what is the most I would owe, and does it stop when someone else moves in?',
  },
  {
    id: 'relet-liability',
    group: 'term',
    title: 'Liable until the unit is re-let',
    detect: (s) => {
      if (
        /\b(shall|will|must|agrees to) (use|make) (commercially )?reasonable (efforts|attempts) to (re-?let|re-?rent|mitigate)/i.test(
          s,
        )
      )
        return null;
      if (/\b(landlord|lessor)\b[^.]{0,30}\b(shall|will) mitigate\b/i.test(s)) return null;
      return any(
        s,
        /\b(no|not)\b[^.]{0,30}\b(obligation|duty|required|responsib\w+)\b[^.]{0,20}\bto\b[^.]{0,10}\b(re-?let|re-?rent|mitigate|find a (new|replacement) tenant)/i,
        /\bremain\w*\b[^.]{0,20}\b(liable|responsible)\b[^.]{0,100}\b(re-?let|re-?rent\w*|remainder of the (term|lease)|until the (end|expiration))/i,
        /\bliable for\b[^.]{0,60}\brent\b[^.]{0,60}\b(until|through|for the remainder)\b[^.]{0,40}\b(re-?let|re-?rent\w*|end of the term|new tenant|expiration)/i,
      )
        ? 'high'
        : null;
    },
    explain:
      'Even after you move out, you keep owing rent until the landlord finds a new tenant or the lease ends, and the landlord does not have to try to find one.',
    normal:
      'In many places landlords must make reasonable efforts to re-rent a unit, and your liability ends when a new tenant starts paying.',
    why: 'Without a duty to re-let, a landlord can leave the unit empty and still bill you for months.',
    ask: 'Could the lease say the landlord will make reasonable efforts to re-let the unit if I leave early, and that my rent obligation ends on the day a replacement tenant starts paying?',
    question: 'Will you actively try to re-rent the unit if I have to leave, and when does my responsibility for rent stop?',
  },
  {
    id: 'holdover',
    group: 'term',
    title: 'Holdover penalty',
    detect: (s) =>
      all(
        s,
        /\b(holdover|hold over|holds over|holding over|remain\w* in possession|stay\w* (past|beyond|after)|after (the )?(expiration|end) of (the|this) (lease|term))\b/i,
      ) && any(s, /\b(double|twice|two times|2x|150\s?%|200\s?%|\d+\s?%|per day|daily|each day|per diem)\b/i)
        ? 'medium'
        : null,
    explain:
      'If you stay even briefly after the lease ends, you pay a much higher rate, such as double rent or a daily charge.',
    normal:
      'A modest premium of up to about 150% of rent, prorated per day, is common. Double rent plus extra fees is harsh.',
    why: 'A delayed move-out of a few days (a late truck, a gap before the next lease) can become expensive.',
    ask: 'Could the holdover rate be limited to the normal rent prorated per day, with a short grace period of a few days for moving out?',
    question: 'What do I pay if I need a few extra days to move out at the end of the lease?',
  },
  {
    id: 'long-notice',
    group: 'term',
    title: 'Long notice to move out',
    detect: (s) => {
      const about =
        /\b(vacate|terminat\w+|move out|moving out|end (the )?(tenancy|lease)|non-?renewal|not to renew|intent\w* to (leave|move|vacate))\b/i.test(
          s,
        );
      const notice = /\bnotice\b/i.test(s);
      if (!about || !notice) return null;
      if (/\b(landlord|lessor|owner)\b[^.]{0,20}\bmust give\b/i.test(s)) return null;
      return maxDays(s) >= 60 ? 'medium' : null;
    },
    explain:
      'You must tell the landlord very early (60 days or more) that you are leaving. Missing the window can extend the lease or cost another month.',
    normal: 'Thirty days of notice is the most common requirement; 60 days is occasionally seen on fixed-term leases.',
    why: 'A long notice period reduces your flexibility and combines badly with automatic renewal.',
    ask: 'Would you be willing to shorten the notice I must give before moving out to 30 days?',
    question: 'How many days of notice do I need to give to leave, and how must it be delivered?',
  },
  {
    id: 'unilateral-changes',
    group: 'term',
    title: 'Landlord can change the rules',
    detect: (s) => {
      if (
        !/\b(landlord|lessor|owner|management)\b[^.]{0,60}\b(may|can|reserves? the right to|has the right to|shall have the right to)\b[^.]{0,40}\b(amend\w*|modify|modif\w+|change|revis\w+|add to|update|adopt|supplement)\b[^.]{0,60}\b(rules?|regulations?|terms|polic(y|ies)|lease|agreement|rates?)\b/i.test(
          s,
        )
      )
        return null;
      if (
        /\b(written consent|signed by both|both parties|mutual(ly)?|agreed in writing|with (the )?tenant'?s consent)\b/i.test(
          s,
        )
      )
        return null;
      return 'medium';
    },
    explain: 'The landlord can add or change rules and sometimes terms during your lease without your agreement.',
    normal:
      'Changes to a signed lease normally need both sides to agree in writing. New house rules should be reasonable and not change core terms.',
    why: 'A lease you sign today could quietly become a different lease tomorrow.',
    ask: 'Could we state that changes to the lease or rules only apply if both of us agree in writing, and that new rules cannot change rent, deposit or the length of the term?',
    question: 'Can the rules change while I live here, and if so how would I be told?',
  },
];
