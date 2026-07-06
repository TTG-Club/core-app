import type { NameResponse, SourceResponse } from '~/shared/types';

export interface SpellLinkResponse {
  url: string;
  name: NameResponse;
  level: number;
  school: string;
  source: SourceResponse;
  concentration?: boolean;
  ritual?: boolean;
  components: SpellLinkComponents;
  classes: Array<SpellClassAffiliation>;
}

export interface SpellClassAffiliation {
  url: string;
  name: string;
}

export interface SpellLinkComponents {
  v?: boolean;
  s?: boolean;
  m?: boolean;
}
