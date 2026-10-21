import type { Rule, Severity } from '../types';
import { any, maxDollars } from './util';

export const liabilityRules: Rule[] = [
  {
    id: 'repairs-on-tenant',
    group: 'liability',
    title: 'Repairs shifted to the tenant',
    detect: (s): Severity | null => {
      const shifted =
        /\b(tenant|lessee|resident|renter)\b[^.]{0,30}\b(shall|will|must|agrees to|is responsible for|are responsible for|is liable for|shall be responsible for|shall pay for|will pay for|bears?)\b[^.]{0,80}\b(repairs?|maintenance|maintain|plumbing|hvac|heating|air.?condition\w*|appliances?|roof|structural|water heater|replac\w+|pest control)\b/i.test(
          s,
        ) ||
        /\b(landlord|lessor|owner)\b[^.]{0,30}\b(shall|will|has) (not|no)\b[^.]{0,40}\b(obligation|responsib\w+|duty|liab\w+)\b[^.]{0,20}\b(repair|maintain|maintenance)/i.test(s) ||
        /\ball (repairs|maintenance)\b[^.]{0,40}\b(tenant'?s|at tenant'?s|by (the )?tenant)\b/i.test(s);
      if (!shifted) return null;
      if (/\b(light ?bulbs?|batter(y|ies)|air filters?|smoke (detector|alarm)s?|drain (stoppages|clogs)? caused by)\b/i.test(s) && !/\b(all|any|major|structural|hvac|plumbing|roof|water heater)\b/i.test(s)) return null;
      if (/\bdamage (caused|due)\b[^.]{0,30}\b(tenant|negligence|misuse|abuse|guests?)\b/i.test(s) && !/\b(all|any|regardless|even if|whether or not)\b[^.]{0,40}\b(repairs?|maintenance)\b/i.test(s)) return null;
      return any(
        s,
        /\b(all|any|every|regardless|major|structural|hvac|plumbing|roof|water heater|appliances?|even if|whether or not|normal wear)\b/i,
      )
        ? 'high'
        : 'medium';
    },
    explain:
      'You are asked to pay for or arrange repairs that are usually the landlord’s job, such as heating, plumbing or appliances, possibly even when you did not cause the damage.',
    normal:
      'Landlords generally keep the home habitable and repair systems that fail through normal use. Tenants pay for damage they or their guests cause, and for small items like light bulbs.',
    why: 'A broken boiler or leak could cost you hundreds or thousands, and you may also be told you cannot withhold rent.',
    ask: 'Could the lease say the landlord is responsible for repairs to the plumbing, heating, cooling, appliances and structure unless the damage was caused by me or my guests?',
    question: 'Who pays if the heating, water heater or an appliance breaks through normal use?',
  },
  {
    id: 'joint-and-several',
    group: 'liability',
    title: 'Joint and several liability',
    detect: (s) =>
      any(
        s,
        /\bjointly\s+and\s+severally\b|\bjoint\s+and\s+several\b/i,
        /\beach\s+(tenant|roommate|resident|lessee)\b[^.]{0,30}\b(is|shall be|are)\b[^.]{0,20}\b(fully |individually )?(liable|responsible)\b[^.]{0,20}\bfor (the )?(entire|full|all|total)\b/i,
        /\b(entire|full|total)\b[^.]{0,40}\brent\b[^.]{0,60}\bregardless of which\b/i,
        /\bliable for the full amount\b/i,
      )
        ? 'medium'
        : null,
    explain:
      'If you share the lease, each roommate can be made to pay the whole rent and all damages, not just their own share.',
    normal:
      'Joint and several liability is very common in shared leases, but you can reduce the risk with separate leases, a roommate agreement, or a clause that limits each person to their share.',
    why: 'If one roommate stops paying or leaves, the landlord can pursue you for everything.',
    ask: 'Could we individualize the lease so that each tenant is responsible for their own share of rent, or at least confirm in writing how the landlord will handle a roommate leaving?',
    question: 'If a roommate stops paying, can you ask me for their share, and could we sign individual leases instead?',
  },
  {
    id: 'waiver-of-rights',
    group: 'liability',
    title: 'Waiver of tenant rights',
    detect: (s) => {
      if (/\b(does|do|shall|will|is) not waive\b|\bno waiver\b|\bnon-?waiver\b|\bfailure (of|by) [^.]{0,30}to enforce\b/i.test(s)) return null;
      return any(
        s,
        /\b(tenant|lessee|resident|renter|you)\b[^.]{0,80}\b(waive\w*|relinquish\w*|give[s]? up|forfeit\w*)\b[^.]{0,80}\b(rights?|claims?|jury|notice|habitab\w+|remed\w+|defenses?|damages|deposit)\b/i,
        /\bwaive\w*\s+(the\s+)?(right\s+to\s+)?(a\s+)?(trial\s+by\s+)?jury\b/i,
        /\bwaive\w*[^.]{0,30}\b(notice to (quit|vacate|cure)|implied warranty of habitability|habitability)\b/i,
        /\bhereby releases?\b[^.]{0,30}\b(landlord|lessor|owner)\b/i,
        /\b(agree|agrees|promises?)\s+(not\s+to|never to)\s+(sue|withhold rent|report|complain|contact (the )?(city|authorities|inspector))\b/i,
      )
        ? 'high'
        : null;
    },
    explain:
      'You give up legal rights, such as a jury trial, notice before eviction, or the right to complain to authorities or withhold rent.',
    normal:
      'Tenants usually cannot sign away core protections, and some waivers are void. A jury-trial waiver or notice waiver in a standard residential lease is a red flag.',
    why: 'Even if a court would not enforce it, you may not know that, and the clause can discourage you from using your rights.',
    ask: 'Could we remove the language where I waive legal rights or remedies, since these protections generally cannot be waived in a residential lease?',
    question: 'Which rights am I giving up by signing, and are any of them required by law to stay with me?',
  },
  {
    id: 'attorney-fees',
    group: 'liability',
    title: 'One-sided attorney fees',
    detect: (s) => {
      if (!/\b(attorneys?'?s?'?|legal|collection|court)\s+(fees|costs|expenses)\b/i.test(s)) return null;
      if (/\bprevailing party\b|\beither party\b|\bmutual\w*\b|\breciprocal\b|\beach party\b|\bwinning party\b/i.test(s)) return null;
      return /\b(tenant|lessee|resident|renter|you)\b[^.]{0,100}\b(pay|reimburse|liable|responsible|bear|owe)\w*\b/i.test(s) ||
        /\b(landlord|lessor|owner)'?s\s+(attorney|legal)/i.test(s)
        ? 'medium'
        : null;
    },
    explain:
      'If there is any dispute you must pay the landlord’s lawyer, but the landlord does not owe you the same.',
    normal: 'Fair clauses are mutual: whoever wins recovers reasonable attorney fees. Many places require reciprocity by law.',
    why: 'The threat of paying lawyers can stop you from challenging an unfair charge.',
    ask: 'Could the attorney fee clause be mutual, so the prevailing party recovers reasonable fees?',
    question: 'If we disagree and it goes to court, who pays the legal costs?',
  },
  {
    id: 'landlord-liability-waiver',
    group: 'liability',
    title: 'Landlord disclaims liability',
    detect: (s) => {
      if (/\bexcept\b[^.]{0,60}\b(negligen\w+|willful|misconduct|gross)\b/i.test(s)) return null;
      return any(
        s,
        /\b(landlord|lessor|owner|management)\b[^.]{0,80}\b(not|nor|no)\b[^.]{0,20}\b(be )?(liable|responsible|liability)\b[^.]{0,80}\b(injur\w+|damage\w*|loss|theft|property|criminal|negligen\w+|death|any)\b/i,
        /\b(tenant|lessee|resident|you)\b[^.]{0,40}\b(agrees? to|shall|will)\b[^.]{0,30}\b(indemnify|hold harmless|defend)\b/i,
        /\bat (tenant'?s|your) (own )?risk\b/i,
      )
        ? 'high'
        : null;
    },
    explain:
      'The landlord says they are not responsible for injuries, theft or damage to your belongings, even when they are at fault, or you must cover their costs if someone makes a claim.',
    normal:
      'Landlords commonly are not liable for your belongings and ask you to insure them. They cannot usually exclude liability for their own negligence.',
    why: 'If a broken stair or poor lighting hurts you, a broad disclaimer could be used against you.',
    ask: 'Could the clause exclude liability only for things outside the landlord’s control and keep the landlord responsible for their own negligence?',
    question: 'What is the landlord responsible for if something goes wrong in the building?',
  },
  {
    id: 'mold-pest-disclaimer',
    group: 'liability',
    title: 'Mold and pest disclaimers',
    detect: (s) => {
      if (!/\b(mold|mildew|fungus|bed ?bugs?|pests?|insects?|roach\w*|rodents?|mice|termites?|vermin|infestation)\b/i.test(s)) return null;
      if (/\b(landlord|lessor|owner)\b[^.]{0,40}\b(will|shall) (arrange|pay|treat|remediate|provide)\b/i.test(s)) return null;
      return any(
        s,
        /\b(not (be )?(liable|responsible)|waive\w*|disclaim\w*|releas\w+|no (representation|warrant\w+))\b/i,
        /\btenant\b[^.]{0,40}\b(is|shall be|will be|agrees to be)\b[^.]{0,30}\b(responsible|liable)\b/i,
        /\bat tenant'?s (own )?(expense|cost)\b/i,
        /\btenant\b[^.]{0,40}\b(shall|must|will)\b[^.]{0,20}\b(pay|bear|cover)\b/i,
      )
        ? 'medium'
        : null;
    },
    explain:
      'The landlord disclaims responsibility for mold or pests, or makes you pay to deal with them, even though these are often building problems.',
    normal:
      'Landlords usually must keep the unit free of infestations and mold caused by the building. Tenants are expected to report problems and keep things clean.',
    why: 'Mold and bed bugs affect health and your belongings, and treatment can be costly.',
    ask: 'Could the landlord be responsible for treating mold and infestations that are not caused by me, with a commitment to respond within a few days of a report?',
    question: 'Has the unit had mold or pest issues, and who handles and pays for treatment?',
  },
  {
    id: 'insurance-requirement',
    group: 'liability',
    title: 'Mandatory renters insurance',
    detect: (s): Severity | null => {
      if (!/\b(renter'?s?|tenant'?s?|liability)\s+insurance\b/i.test(s)) return null;
      if (/\b(encourag\w+|recommend\w*|optional|not (be )?required|strongly suggest\w*|advis\w+)\b/i.test(s)) return null;
      if (!/\b(require\w*|must|shall|obtain|maintain|carry|provide|proof)\b/i.test(s)) return null;
      return /\b(additional insured|named insured|loss payee|beneficiary)\b/i.test(s) || maxDollars(s) >= 100000 || /\b(minimum|at least)\b/i.test(s)
        ? 'medium'
        : 'low';
    },
    explain: 'You must buy renters insurance and may need to meet a minimum coverage or add the landlord to your policy.',
    normal:
      'Requiring renters insurance with $100,000 liability is common and usually inexpensive. Check the minimum and who benefits.',
    why: 'It is an extra monthly cost, and high minimums or special endorsements can raise the price.',
    ask: 'Could you confirm the minimum coverage required and that a standard renters policy at that level is enough?',
    question: 'What are the exact insurance requirements, and what proof do you need?',
  },
];
