import type { SourceResponse } from '~/shared/types';

export interface SpellDetail {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  level: number;
  school: string;
  additionalType?: string;
  source: SourceResponse;
  castingTime: string;
  ritual?: boolean;
  concentration?: boolean;
  range: string;
  duration: string;
  components: {
    v?: boolean;
    s?: boolean;
    m?: string;
  };
  description: string;
  upper?: string;
  affiliation?: SpellDetailAffiliation;
  updatedAt: string;
}

export interface SpellDetailAffiliation {
  classes?: Array<SpellDetailAffiliationItem>;
  subclasses?: Array<SpellDetailAffiliationItem>;
  species?: Array<SpellDetailAffiliationItem>;
  lineages?: Array<SpellDetailAffiliationItem>;
}

export interface SpellDetailAffiliationItem {
  url: string;
  name: string;
}
