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
}

export interface SpellLinkComponents {
  v?: boolean;
  s?: boolean;
  m?: boolean;
}
