import { AbilityKey, AbilityShortKey } from '~/shared/types';

import type { EditorBaseInfoState } from '~ui/editor';

export interface CreatureCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  image: string | undefined;

  types: CreatureTypes; // типы существа
  sizes: CreatureSizes; // размеры существа
  alignment: string | undefined; // мировоззрение
  ac: ArmorClass; // класс доспеха
  initiative: CreateInitiative; // модификатор инициативы
  hit: CreateHit;
  speeds: CreateSpeeds;
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
  legendary: LegendaryActions;
  lairEffects: Array<CreateAction>;
  section: CreateSection;
}

export interface LegendaryActions {
  count: number;
  inLair: number | undefined;
  description: string | undefined;
  actions: Array<CreateAction>;
}

export interface CreateSection {
  name: {
    rus: string;
    eng: string;
  };
  subtitle: string;
  habitats: Array<string>;
  treasures: Array<string>;
  description: string;
}

export interface CreateInitiative {
  value: number;
  multiplier: number;
}

export interface CreatureTypes {
  values: Array<string>;
  text: string | undefined;
}

export interface CreatureSizes {
  values: Array<'GARGANTUAN' | 'HUGE' | 'LARGE' | 'MEDIUM' | 'SMALL' | 'TINY'>;
  text: string | undefined;
  sizeString: string | undefined;
}

export interface ArmorClass {
  value: number;
  text: string;
}

export interface CreateHit {
  value: number; // среднее количество хитов или абсолютное значение
  countHitDice: number | undefined; // количество костей хитов
  text: string | undefined; // текстовое описание хитов
}

export enum SpeedType {
  WALK = 'walk',
  FLY = 'fly',
  SWIM = 'swim',
  CLIMB = 'climb',
  BURROW = 'burrow',
}

export interface CreateSpeeds {
  [SpeedType.WALK]: Array<CreateSpeed>;
  [SpeedType.FLY]: Array<CreateSpeed>;
  [SpeedType.SWIM]: Array<CreateSpeed>;
  [SpeedType.CLIMB]: Array<CreateSpeed>;
  [SpeedType.BURROW]: Array<CreateSpeed>;
}

export interface CreateSpeed {
  value: number;
  text: string | undefined;
  hover?: boolean;
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
  values: Array<CreateLanguage>;
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
  darkvision: number | undefined;
  truesight: number | undefined;
  blindsight: number | undefined;
  tremorsense: number | undefined;
  passivePerception: number;
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
  recharge: string | undefined;
  restrictionOfUse: string | undefined;
}

export interface SavingThrow {
  ability: string;
  dc: string;
}

export function getInitialState(): CreatureCreate {
  return {
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    source: {
      url: undefined,
      page: undefined,
    },
    description: '',
    image: undefined,
    tags: [],
    types: {
      values: [], // типы существа
      text: undefined, // уточнение типа
    },
    sizes: {
      values: [],
      text: undefined,
      sizeString: undefined,
    },
    alignment: undefined, // мировоззрение
    ac: {
      value: 10, // класс доспеха
      text: '',
    },
    initiative: {
      value: 0,
      multiplier: 0,
    },
    hit: {
      value: 0, // среднее количество хитов или абсолютное значение
      text: undefined, // текстовое описание хитов
      countHitDice: undefined, // количество костей хитов
    },
    speeds: {
      walk: [
        {
          value: 30,
          text: undefined,
        },
      ],
      burrow: [],
      fly: [],
      swim: [],
      climb: [],
    },
    abilities: {
      [AbilityShortKey.STRENGTH]: {
        ability: AbilityKey.STRENGTH,
        value: 10,
        multiplier: 0,
      },
      [AbilityShortKey.DEXTERITY]: {
        ability: AbilityKey.DEXTERITY,
        value: 10,
        multiplier: 0,
      },
      [AbilityShortKey.CONSTITUTION]: {
        ability: AbilityKey.CONSTITUTION,
        value: 10,
        multiplier: 0,
      },
      [AbilityShortKey.INTELLIGENCE]: {
        ability: AbilityKey.INTELLIGENCE,
        value: 10,
        multiplier: 0,
      },
      [AbilityShortKey.WISDOM]: {
        ability: AbilityKey.WISDOM,
        value: 10,
        multiplier: 0,
      },
      [AbilityShortKey.CHARISMA]: {
        ability: AbilityKey.CHARISMA,
        value: 10,
        multiplier: 0,
      },
    },
    skills: [],
    vulnerabilities: [],
    resistance: [],
    immunityToDamage: [],
    immunityToCondition: [],
    equipments: [],
    senses: {
      darkvision: undefined,
      truesight: undefined,
      blindsight: undefined,
      tremorsense: undefined,
      passivePerception: 10,
    },
    languages: {
      values: [],
      text: undefined,
      telepathy: undefined,
    },
    proficiencyBonus: 2,
    experience: {
      value: 0,
      inLair: undefined,
      suffix: undefined,
    },
    traits: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    legendary: {
      count: 0,
      inLair: 0,
      description: '',
      actions: [],
    },
    lairEffects: [],
    section: {
      name: {
        rus: '',
        eng: '',
      },
      subtitle: '',
      habitats: [],
      treasures: [],
      description: '',
    },
  };
}
