import type { Rule } from '../types';
import { termRules } from './term';
import { moneyRules } from './money';
import { accessRules } from './access';
import { liabilityRules } from './liability';
import { livingRules } from './living';

export const RULES: Rule[] = [...termRules, ...moneyRules, ...accessRules, ...liabilityRules, ...livingRules];

export const RULES_BY_ID: Record<string, Rule> = Object.fromEntries(RULES.map((r) => [r.id, r]));
