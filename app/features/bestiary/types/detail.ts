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
  AC: string;
  CR: string;
  hit: Hit;
  speed: string;
  abilities: {
    strength: Ability;
    dexterity: Ability;
    constitution: Ability;
    intelligence: Ability;
    wisdom: Ability;
    charisma: Ability;
  };
  languages: string;
  traits: Array<Trait>;
  actions: Array<Action>;
  reactions: Array<Action>;
  bonusActions: Array<Action>;
  legendaryActions: Array<Action>;
}

export interface Hit {
  hit: number;
  formula: string;
  text: string;
}

export interface Ability {
  value: string;
  mod: string;
  sav: string;
}

export interface Trait {
  name: string;
  english: string;
  description: string;
}

export interface Action {
  name: string;
  english: string;
  description: string;
}
