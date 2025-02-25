export interface SpellLink {
  url: string;
  name: SpellLinkName;
  level: number;
  school: string;
  group: SpellLinkGroup;
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
