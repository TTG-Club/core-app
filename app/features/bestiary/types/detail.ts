import type { SourceResponse } from '~/shared/types';

export interface CreatureDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  image: string;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
  header: string;
  initiative: string;
  ac: string;
  cr: string;
  hit: CreatureHitResponse;
  speed: string;
  abilities: CreatureAbilitiesResponse;
  skills?: string;
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
    description: string;
  };
  lair: {
    description: Array<string>;
    effects: Array<CreatureActionResponse>;
  };
  section: CreatureSection;
}

export interface CreatureSection {
  name: {
    rus: string;
    eng: string;
  };
  subtitle: string;
  habitats: string;
  treasures: string;
  description: Array<string>;
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
  description: Array<string>;
}

export interface CreatureActionResponse {
  name: {
    rus: string;
    eng: string;
  };
  english: string;
  description: Array<string>;
}
