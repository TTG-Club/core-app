import type { ActiveEffect } from '~active-effects/model';
import type { EditorBaseInfoState } from '~ui/editor';

import type { CreatureActionEffect } from './action';
import type { CreatureSpellcastingBlock } from './spellcasting';

import { AbilityKey, AbilityShortKey } from '~/shared/types';

import {
  createEmptyCreatureActionEffect,
  normalizeCreatureActionEffect,
} from './action';

/**
 * Раздел карточки предмета. Справочника два — обычные предметы и магические, —
 * а слаг у них общего вида: без раздела ни ссылку построить, ни название
 * обновить.
 */
export type CreatureInventorySection = 'items' | 'magic-items';

/** Позиция инвентаря существа — карточка предмета с сайта. */
export interface CreatureInventoryItem {
  section: CreatureInventorySection;
  url: string | undefined;
  /** Название на момент выбора: карточку могли переименовать */
  name: string | undefined;
  quantity: number | undefined;
  description: string | undefined;
}

/** Пустая строка инвентаря — для добавления и для сравнения на пустоту. */
export function getEmptyCreatureInventoryItem(): CreatureInventoryItem {
  return {
    section: 'items',
    url: undefined,
    name: undefined,
    quantity: undefined,
    description: undefined,
  };
}

export interface CreatureCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  image: string | undefined;
  gallery: Array<string>;

  types: CreatureTypes; // типы существа
  sizes: CreatureSizes; // размеры существа
  alignment: string | undefined; // мировоззрение
  ac: ArmorClass; // класс доспеха
  initiative: CreateInitiative; // модификатор инициативы
  hit: CreateHit;
  speeds: CreateSpeeds;
  abilities: CreateAbilities;
  skills: Array<CreateSkill>;
  defenses: CreatureDefenses;
  /** Снаряжение строкой — поле старого импорта, запасной вид для показа */
  equipments: string | undefined;
  inventory: Array<CreatureInventoryItem>;
  inventoryText: string | undefined;
  senses: CreatureSenses;
  languages: CreatureLanguages;
  proficiencyBonus: number;
  experience: CreateExperience;
  traits: Array<CreateTrait>;
  actions: Array<CreateAction>;
  bonusActions: Array<CreateAction>;
  reactions: Array<CreateAction>;
  legendary: LegendaryActions;
  lair: CreatureLair;
  section: CreateSection;

  /**
   * Заклинания существа блоками. Ни на карточке сайта, ни в выгрузке markdown
   * они не показываются: статблок описывает заклинания текстом записи, а блоки
   * заведены ради виртуального стола — там у существа своя вкладка заклинаний.
   */
  spellcasting: Array<CreatureSpellcastingBlock>;

  /**
   * Активные эффекты существа в вокабуляре VTTG — та же модель, что у черты,
   * заклинания и предмета.
   *
   * Статблок описывает существо числами, а эффект — то, чем существо постоянно
   * отличается от своих чисел или что оно накладывает: аура, врождённое
   * состояние, защита с условием. На виртуальном столе такой эффект уезжает на
   * токен как есть.
   */
  activeEffects: Array<ActiveEffect>;
}

export interface CreatureDefenses {
  vulnerabilities: CreatureDefense;
  resistances: CreatureDefense;
  immunities: CreatureImmunities;
}

export interface CreatureDefense {
  values: Array<string> | undefined;
  text: string | undefined;
}

export interface CreatureImmunities {
  damage: Array<string> | undefined;
  condition: Array<string> | undefined;
  text: string | undefined;
}

export interface LegendaryActions {
  count: number;
  inLair: number | undefined;
  description: string | undefined;
  actions: Array<CreateAction>;
}

export interface CreatureLair {
  name: string;
  description: string;
  effects: Array<CreateAction>;
  ending: string;
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
  multiplier: 0 | 1 | 2;
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

export type CreateAbilities = Record<AbilityShortKey, CreateAbility>;

export interface CreateAbility {
  ability: AbilityKey;
  value: number;
  multiplier: 0 | 1 | 2;
}

export interface CreateSkill {
  skill: string | undefined;
  multiplier: 0 | 1 | 2;
  bonus: number;
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

export interface CreateExperience {
  value: number;
  inLair: number | undefined;
  suffix: string | undefined;
}

export interface CreatureSenses {
  darkvision: number | undefined;
  unimpeded: boolean | undefined; // истина если существо беспрепятственно видит через магическую тьму
  truesight: number | undefined;
  blindsight: number | undefined;
  tremorsense: number | undefined;
  passivePerception: number;
}

/**
 * Запись боевого блока существа: умение, действие, бонусное действие, реакция,
 * легендарное действие или эффект логова.
 *
 * Тип один на все шесть списков: у них одинаковый набор полей, а разное —
 * только заголовок списка и место в форме.
 */
export interface CreateAction {
  name: {
    rus: string;
    eng: string;
  };
  description: string;
  recharge: string | undefined;
  effect: CreatureActionEffect;
}

/** Умение существа — та же запись, что и действие. */
export type CreateTrait = CreateAction;

/**
 * Готовит записи боевого блока к отправке.
 *
 * @param actions записи из формы.
 * @returns записи для запроса.
 */
export function normalizeCreatureActions(
  actions: Array<CreateAction>,
): Array<CreateAction> {
  return actions.map((action) => ({
    ...action,
    effect: normalizeCreatureActionEffect(action.effect),
  }));
}

/**
 * Создаёт пустую запись боевого блока.
 *
 * @returns запись без названия, описания и механики.
 */
export function createEmptyCreatureAction(): CreateAction {
  return {
    name: {
      rus: '',
      eng: '',
    },
    description: '',
    recharge: undefined,
    effect: createEmptyCreatureActionEffect(),
  };
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
    srdVersion: undefined,
    description: '',
    image: undefined,
    gallery: [],
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
    defenses: {
      vulnerabilities: {
        values: [],
        text: undefined,
      },
      resistances: {
        values: [],
        text: undefined,
      },
      immunities: {
        damage: [],
        condition: [],
        text: undefined,
      },
    },
    equipments: undefined,
    inventory: [],
    inventoryText: undefined,
    senses: {
      darkvision: undefined,
      unimpeded: undefined,
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
      actions: [],
      description: '',
    },
    lair: {
      name: '',
      effects: [],
      description: '',
      ending: '',
    },
    spellcasting: [],
    activeEffects: [],
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
