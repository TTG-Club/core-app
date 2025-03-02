import type { SourceResponse } from '../../base';

export interface SpellLinkResponse {
  url: string;
  name: SpellLinkName;
  level: number;
  school: string;
  source: SourceResponse;
  concentration?: boolean;
  ritual?: boolean;
  components: SpellLinkComponents;
}

export interface SpellLinkName {
  rus: string;
  eng: string;
}

export interface SpellLinkGroup {
  name: string;
  label: string;
}

export interface SpellLinkComponents {
  v?: boolean;
  s?: boolean;
  m?: boolean;
}
