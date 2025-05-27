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
    str: Ability;
    dex: Ability;
    con: Ability;
    int: Ability;
    wis: Ability;
    chr: Ability;
  };
  skills: string;
  vulnerability: string;
  resistance: string;
  immunity: string;
  languages: string;
  sense: string;
  traits: Array<Trait>;
  actions: Array<Action>;
  reactions: Array<Action>;
  bonusActions: Array<Action>;
  legendaryAction: number;
  legendaryActionInLair: number;
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
  name: {
    rus: string;
    eng: string;
  };
  english: string;
  description: Array<string>;
}

export interface Action {
  name: {
    rus: string;
    eng: string;
  };
  english: string;
  description: Array<string>;
}
