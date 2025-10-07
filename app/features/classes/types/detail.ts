import type { Level, NameResponse, SourceResponse } from '~/shared/types';
import type { EntryList } from '~ui/markup';
import type { ClassLinkResponse } from './link';

export interface ClassDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  description: EntryList;
  image?: string;
  gallery?: Array<string>;
  casterType: CasterType;
  updatedAt: string;
  hitDice: HitDice;
  primaryCharacteristics: string;
  username: string;
  proficiency: ClassProficiency;
  equipment: EntryList;
  savingThrows: string;
  table: Array<ClassTable>;
  features: Array<ClassFeature>;
  hasSubclasses?: boolean;
  parent?: ClassLinkResponse;
}

export interface ClassTable {
  name: string;
  scaling: Array<{
    level: Level;
    value: string;
  }>;
}

export interface ClassFeature {
  key: string;
  level: Level;
  name: string;
  description: EntryList;
  additional: string;
  isSubclass?: boolean;
  scaling?: Array<{
    level: Level;
    name: string;
    description: EntryList;
    additional: string;
  }>;
}

export interface ClassProficiency {
  armor: string;
  weapon: string;
  tool: string;
  skill: string;
}

export interface HitDice {
  label: string;
  value: string;
  maxValue: number;
  avg: number;
}

export enum CasterType {
  NONE = 'NONE',
  THIRD = 'THIRD',
  HALF = 'HALF',
  FULL = 'FULL',
  PACT = 'PACT',
}
