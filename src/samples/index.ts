import { MAPLE_COURT } from './maple-court';
import { RIVERSIDE_HOUSE } from './riverside-house';

export interface Sample {
  id: string;
  name: string;
  blurb: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: 'maple-court',
    name: 'Student apartment',
    blurb: 'A one-year lease with many red flags',
    text: MAPLE_COURT,
  },
  {
    id: 'riverside-house',
    name: 'Shared house',
    blurb: 'A mostly fair lease with a few things to check',
    text: RIVERSIDE_HOUSE,
  },
];
