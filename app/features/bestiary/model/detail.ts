import type { JSONContent } from '@tiptap/core';

import type { SourceResponse } from '~/shared/types';

export interface CreatureDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  image: string;
  source: SourceResponse;
  description: JSONContent;
  updatedAt: string;
  header: string;
  initiative: {
    label: string;
    value: string;
  };
  ac: string;
  cr: string;
  hit: CreatureHitResponse;
  speed: string;
  abilities: CreatureAbilitiesResponse;
  skills?: Array<Skill>;
  equipments?: JSONContent;
  vulnerability?: string;
  resistance?: string;
  immunity?: string;
  languages?: string;
  sense?: string;
  traits: Array<CreatureTraitResponse>;
  actions: Array<CreatureActionResponse>;
  reactions: Array<CreatureActionResponse>;
  bonusActions: Array<CreatureActionResponse>;
  legendaryAction: number;
  legendaryActionInLair: number;
  legendary: {
    actions: Array<CreatureActionResponse>;
    count: string;
    description: JSONContent;
  };
  lair: {
    name: string;
    description: JSONContent;
    effects: Array<CreatureActionResponse>;
    ending: Array<string>;
  };
  section: CreatureSection;
}
export interface Skill {
  label: string;
  value: string;
}
export interface CreatureSection {
  name: {
    rus: string;
    eng: string;
  };
  subtitle: string;
  habitats: string;
  treasures: string;
  description: JSONContent;
}

export interface CreatureAbilitiesResponse {
  str: CreatureAbilityResponse;
  dex: CreatureAbilityResponse;
  con: CreatureAbilityResponse;
  int: CreatureAbilityResponse;
  wis: CreatureAbilityResponse;
  chr: CreatureAbilityResponse;
}

export interface CreatureHitResponse {
  hit: number;
  formula: string;
  text: string;
}

export interface CreatureAbilityResponse {
  value: string;
  mod: string;
  sav: string;
}

export interface CreatureTraitResponse {
  name: {
    rus: string;
    eng: string;
  };
  english: string;
  description: JSONContent;
}

export interface CreatureActionResponse {
  name: {
    rus: string;
    eng: string;
  };
  english: string;
  description: JSONContent;
}
