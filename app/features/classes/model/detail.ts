import type { Level, NameResponse, SourceResponse } from '~/shared/types';
import type { RenderNode } from '~ui/markup';

import type { ClassLinkResponse } from './link';

export interface ClassDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  description: RenderNode;
  image?: string;
  gallery?: Array<string>;
  casterType: CasterType;
  updatedAt: string;
  hitDice: HitDice;
  primaryCharacteristics: string;
  username: string;
  proficiency: ClassProficiency;
  equipment: RenderNode;
  savingThrows: string;
  table: Array<ClassTable>;
  features: Array<ClassFeature>;
  hasSubclasses?: boolean;
  parent?: ClassLinkResponse;
  multiclass?: Array<ClassInMulticlass>;
}

// Расширенный тип для ответа API мультикласса
export interface MulticlassDetailResponse extends Omit<
  ClassDetailResponse,
  'hitDice'
> {
  hitDice?: HitDice;
  /**
   * Требования к характеристикам для взятия дополнительных классов. Приходит
   * только в ответе мультикласса — обычный класс такого поля не отдаёт.
   */
  requirements: string;
  characterLevel: number;
  spellcastingLevel?: number;
  multiclassProficiency?: ClassMulticlassProficiency;
}

// Типы для запроса к API мультикласса
export interface AdditionalClassItem {
  url: string;
  level: number;
  subclass?: string;
}

export interface MainClassData {
  url: string;
  level: number;
  subclass?: string;
}

export interface MulticlassLevelEntry {
  class: string;
  level: number;
  subclass?: string;
}

export interface MulticlassRequest {
  levels: Array<MulticlassLevelEntry>;
}

export type ClassResourceRecovery = 'NONE' | 'SHORT_REST' | 'LONG_REST';

export interface ClassTable {
  name: string;
  resourceRecovery: ClassResourceRecovery;
  scaling: Array<{
    level: Level;
    value: string;
  }>;
}

export interface ClassFeature {
  key: string;
  level: Level;
  name: string;
  optionsName?: string;
  description: RenderNode;
  additional: string;
  isSubclass?: boolean;
  fightingStyleChoice?: boolean;
  scaling?: Array<{
    level: Level;
    name: string;
    description: RenderNode;
    additional: string;
  }>;
  options?: Array<ClassFeatureOption>;
}

export interface ClassFeatureOption {
  key: string;
  name: NameResponse;
  description: RenderNode;
  additional?: RenderNode;
  prerequisite?: RenderNode;
  requiredClassLevel?: Level;
  hideInSubclasses?: boolean;

  /** Вариант берут повторно; не задано — берут один раз. */
  repeatable?: boolean;
}

/**
 * Заклинание, которое вариант умения выдаёт без выбора: «Договор цепи» даёт
 * «Поиск фамильяра». Игрок читает это в описании варианта до того, как его
 * выбрать.
 */
export interface FeatureOptionGrantedSpell {
  url: string;

  name: string;

  /** Круг заклинания; 0 — заговор. */
  level: number;
}

/**
 * Вариант умения для показа списком с описаниями: и на странице класса, и в
 * мастере листа персонажа. Плоский вид записи справочника — лист собирает такие
 * же записи из своего разбора детали класса, где типов ответа API уже нет.
 */
export interface FeatureOptionEntry {
  /** Ключ записи справочника; пусто — вместо него берётся название. */
  key: string;

  /** Название варианта — оно же значение пикера в мастере листа. */
  name: string;

  nameEng: string;

  description: RenderNode;

  /** Уточнение под названием (курсивом); пусто — его нет. */
  additional: RenderNode;

  /** Необходимые условия варианта; пусто — их нет. */
  prerequisite: RenderNode;

  /** Уровень класса, с которого вариант доступен; 0 — доступен сразу. */
  requiredClassLevel: number;

  /**
   * Вариант берут повторно: в мастере листа он остаётся в списке и после того,
   * как игрок его взял. Не задано — берут один раз.
   */
  repeatable?: boolean;

  /** Заклинания, которые вариант выдаёт без выбора; пусто — не выдаёт. */
  grantedSpells?: FeatureOptionGrantedSpell[];
}

export interface ClassProficiency {
  armor: string;
  weapon: string;
  tool: string;
  skill: string;
}

export interface ClassMulticlassProficiency {
  armor: string;
  weapon: string;
  toolProficiency?: string;
  skills?: number;
}

export interface HitDice {
  label: string;
  value: string;
  maxValue: number;
  avg: number;
}

export interface ClassInMulticlass {
  class: string;
  subclass?: string;
  level: number;
  hitDice?: string;

  /**
   * Тип заклинателя отрезка: свой у класса-заклинателя, иначе подкласса. По
   * `PACT` уровень Магии договора считается отдельно от общего уровня
   * заклинателя. Пусто — бэкенд ещё не отдаёт поле.
   */
  casterType?: CasterType;
}

export enum CasterType {
  NONE = 'NONE',
  THIRD = 'THIRD',
  HALF = 'HALF',
  FULL = 'FULL',
  PACT = 'PACT',
  MULTICLASS = 'MULTICLASS',
}
