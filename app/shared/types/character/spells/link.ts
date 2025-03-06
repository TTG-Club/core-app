import type { NameResponse, SourceResponse } from '../../base';

export interface SpellLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
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
