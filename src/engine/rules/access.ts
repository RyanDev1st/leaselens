import type { Rule, Severity } from '../types';
import { any, minHours, maxDays } from './util';

const EMERGENCY_OK =
  /(except|other than|unless)[^.,;]{0,40}emergenc\w+|(in|during)\s+(an?\s+|case of an?\s+)?emergenc\w+[^.]{0,30}without\s+(prior\s+)?notice|without\s+(prior\s+)?notice\s+(in|during|if there is)\s+(an?\s+|case of an?\s+)?emergenc\w+/gi;

export const accessRules: Rule[] = [
  {
    id: 'landlord-entry',
    group: 'access',
    title: 'Landlord entry without proper notice',
    detect: (s) => {
      if (!/\b(enter|entry|access|inspect\w*|show\w*)\b/i.test(s)) return null;
      if (!/\b(landlord|lessor|owner|management|agents?)\b/i.test(s)) return null;
      const stripped = s.replace(EMERGENCY_OK, ' ');
      if (
        any(
          stripped,
          /\b(without|no)\b[^.]{0,20}\b(prior\s+)?(notice|consent|permission|notification|advance warning)\b/i,
          /\b(at any time|anytime|any time|at will)\b/i,
          /\bat (its|his|her|their)\s+(sole\s+)?discretion\b/i,
        )
      )
        return 'high';
      if (/\bnotice\b/i.test(s) && minHours(s) < 24) return 'high';
      return null;
    },
    explain:
      'The landlord can walk into your home without telling you first, or with less than a day of notice.',
    normal:
      'Landlords generally must give 24 to 48 hours of written notice for non-emergency entry, at reasonable hours. Entry without notice is limited to real emergencies.',
    why: 'This is your home: privacy, safety and the ability to be present are at stake.',
    ask: 'Could the entry clause require at least 24 hours of written notice and reasonable hours, except for true emergencies such as a fire or burst pipe?',
    question: 'How much notice will you give before entering, and in what situations can you enter without it?',
  },
  {
    id: 'self-help-lockout',
    group: 'access',
    title: 'Lockout or seizure of belongings',
    detect: (s) => {
      if (/\b(may not|shall not|will not|cannot|can not|must not|not permitted to)\b[^.]{0,60}\b(lock|seize|change the locks|remove|shut off)\b/i.test(s))
        return null;
      return any(
        s,
        /\b(landlord|lessor|owner|management)\b[^.]{0,80}\b(change|changing|rekey|re-?key)\b[^.]{0,10}\blocks?\b/i,
        /\block(ing)?\s+(the )?(tenant|you|resident)\s+out\b|\block-?out\b/i,
        /\b(remove|dispose of|discard|sell)\b[^.]{0,30}\b(tenant'?s?|your|resident'?s?)\b[^.]{0,20}\b(belongings|property|possessions|items)\b/i,
        /\b(seize|retain|keep|hold)\b[^.]{0,30}\b(tenant'?s?|your|resident'?s?)\b[^.]{0,20}\b(belongings|property|possessions)\b/i,
        /\bdistrain\w*|\blandlord'?s lien\b/i,
        /\b(shut off|discontinue|disconnect|terminate|cut off)\b[^.]{0,30}\b(utilit\w+|water|electric\w*|heat\w*|gas)\b/i,
      )
        ? 'high'
        : null;
    },
    explain:
      'The lease lets the landlord change the locks, remove your things, or shut off utilities without going through a court.',
    normal:
      'In most places landlords must go through formal court eviction. Self-help like lockouts, utility shut-offs and seizing belongings is illegal in many jurisdictions.',
    why: 'Even if a clause is unenforceable, it signals a landlord willing to pressure tenants and can scare you into leaving.',
    ask: 'Could we remove the language allowing lockouts, removal of belongings or utility shut-off, so that any dispute goes through the legal process?',
    question: 'What is the legal process if there is a dispute over rent or the lease?',
  },
  {
    id: 'guest-limits',
    group: 'access',
    title: 'Guest limits',
    detect: (s): Severity | null => {
      if (!/\b(guests?|visitors?|overnight|house ?guests?|occupants?)\b/i.test(s)) return null;
      const restrict = any(
        s,
        /\b(\d+|\w+)\s*(\(\d+\)\s*)?(consecutive\s+)?(days|nights)\b/i,
        /\b(written (consent|permission|approval)|prior (consent|permission|approval))\b/i,
        /\b(prohibit\w*|not (be )?(allowed|permitted)|no (overnight )?(guests|visitors)|shall not (have|host|allow))\b/i,
        /\bnot exceed\b|\bmore than\b/i,
      );
      if (!restrict) return null;
      const blocks =
        /\b(written (consent|permission|approval)|prior (consent|permission|approval)|prohibit\w*|not (be )?(allowed|permitted)|no (overnight )?(guests|visitors))\b/i.test(
          s,
        );
      if (!blocks && maxDays(s) >= 14) return null;
      if (!/\b(guests?|visitors?)\b/i.test(s)) return null;
      if (/\b(welcome|free to|may host guests freely|no (limit|restriction)s?)\b/i.test(s)) return null;
      return /\b(no (overnight )?(guests|visitors)|prohibit\w*|not (be )?(allowed|permitted)|\b[1-3]\s*(\(\d+\)\s*)?(consecutive\s+)?nights?)\b/i.test(s)
        ? 'medium'
        : 'low';
    },
    explain: 'The lease limits how long guests can stay, or requires permission for them, which can touch partners and family.',
    normal:
      'A cap of about 14 consecutive nights, or 30 nights per year, for guests is common. Banning overnight guests or requiring approval for each is restrictive.',
    why: 'A partner staying often or a parent visiting for a week could put you in breach.',
    ask: 'Could the guest limit be set at 14 consecutive nights (or 30 nights in a year) and not require written approval for short stays?',
    question: 'How long can a guest stay before I need your permission?',
  },
  {
    id: 'subletting-ban',
    group: 'access',
    title: 'Subletting or assignment ban',
    detect: (s): Severity | null => {
      if (!/\b(sub-?let\w*|sub-?leas\w+|assign\w*\s+(this|the|your)\s+(lease|agreement)|assignment|airbnb|vrbo|short-?term rentals?|home-?sharing)\b/i.test(s))
        return null;
      const banned =
        /\b(shall not|may not|must not|cannot|can not|not (be )?(allowed|permitted)|prohibit\w*|forbid\w*|forbidden|no (subletting|subleasing|assignment|sublets?)|without (the )?(prior )?(written )?(consent|permission|approval))\b/i.test(
          s,
        );
      if (!banned) return null;
      if (/\b(consent|approval|permission)\b[^.]{0,60}\b(not (to )?be )?unreasonabl\w+ (withheld|denied|delayed)\b/i.test(s)) return null;
      if (/\bunreasonabl\w+ (withheld|denied)\b/i.test(s)) return null;
      return /\bsole (and absolute )?discretion\b|\b(shall not|may not|must not|cannot|prohibit\w*|forbid\w*|no (subletting|subleasing))\b/i.test(s)
        ? 'medium'
        : 'low';
    },
    explain: 'You cannot sublet your room or assign the lease, or you can only do so if the landlord agrees.',
    normal:
      'Many leases require landlord consent. A reasonable clause says consent cannot be unreasonably withheld, which gives you a way out of the lease.',
    why: 'If you must leave early, subletting is the main way to avoid paying for months you cannot use.',
    ask: 'Could the lease say that subletting or assignment is allowed with the landlord’s written consent, which will not be unreasonably withheld?',
    question: 'If I need to leave early, can I find a replacement tenant, and what is the approval process?',
  },
];
