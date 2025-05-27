import type { AbilityKey, AbilityShortKey } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

export interface CreatureCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  image: string | undefined;

  type: CreatureCategory; // типы существа
  size: CreatureSize; // размеры существа
  alignment: string | undefined; // мировоззрение
  ac: string; // класс доспеха
  initiative: number; // модификатор инициативы
  hit: CreateHit;
  speed: CreateSpeeds;
  abilities: CreateAbilities;
  skills: Array<CreateSkill>;
  vulnerabilities: Array<string>;
  resistance: Array<string>;
  immunityToDamage: Array<string>;
  immunityToCondition: Array<string>;
  equipments: Array<Equipment>;
  senses: CreatureSenses;
  languages: CreatureLanguages;
  proficiencyBonus: number;
  experience: CreateExperience;
  traits: Array<CreateTrait>;
  actions: Array<CreateAction>;
  bonusActions: Array<CreateAction>;
  reactions: Array<CreateAction>;
  legendaryActions: Array<CreateAction>;
}

export interface CreatureCategory {
  type: Array<string>;
  text: string | undefined;
}

export interface CreatureSize {
  size: Array<'GARGANTUAN' | 'HUGE' | 'LARGE' | 'MEDIUM' | 'SMALL' | 'TINY'>;
  text: string | undefined;
  sizeString: string | undefined;
}

export interface CreateHit {
  hit: number; // среднее количество хитов или абсолютное значение
  formula: string | undefined;
  countHitDice: number | undefined; // количество костей хитов
  text: string | undefined; // текстовое описание хитов
}

export interface CreateSpeeds {
  walk: CreateSpeed;
  burrow: CreateSpeed;
  fly: CreateFlySpeed;
  swim: CreateSpeed;
  climb: CreateSpeed;
  text: string | undefined;
}

export interface CreateSpeed {
  value: number;
  text: string | undefined;
}

export interface CreateFlySpeed {
  value: number;
  text: string | undefined;
  hover: boolean | undefined;
}

export type CreateAbilities = Record<AbilityShortKey, CreateAbility>;

export interface CreateAbility {
  ability: AbilityKey;
  value: number;
  multiplier: 0 | 1 | 2;
}

export interface CreateSkill {
  skill: string | undefined;
  multiplier: 0 | 1 | 2;
  text: string | undefined;
}

export interface CreatureLanguages {
  languages: Array<CreateLanguage>;
  text: string | undefined;
  telepathy: string | undefined;
}

export interface CreateLanguage {
  language: string | undefined;
  text: string | undefined;
}

export interface Equipment {
  url: string;
  name: string;
  quantity: string;
}

export interface CreateExperience {
  value: number;
  inLair: number | undefined;
  suffix: string | undefined;
}

export interface CreatureSenses {
  senses: Array<CreatureSense>;
  passivePerception: number;
}

export interface CreatureSense {
  type: string;
  value: number;
}

export interface CreateTrait {
  name: {
    rus: string;
    eng: string;
  };
  description: string;
}

export interface CreateAction {
  name: {
    rus: string;
    eng: string;
  };
  description: string;
  attackType: string;
  sawingThrows: Array<SavingThrow>;
  damageTypes: Array<string>;
  recharge: string;
  restrictionOfUse: string;
}

export interface SavingThrow {
  ability: string;
  dc: string;
}
