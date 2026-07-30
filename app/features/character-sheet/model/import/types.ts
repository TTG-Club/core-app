import type { Character } from '../types';

/** Оружие из списка атак Long Story Short. */
export interface LssWeapon {
  name: string;

  /** Формула урона, как её хранит LSS («1к8+[str]»); '' — не задана. */
  damage: string;

  /** Тип урона прозой («рубящий»); '' — не указан. */
  damageType: string;

  /** Персонаж владеет этим оружием. */
  isProficient: boolean;
}

/** Счётчик (ресурс) Long Story Short. */
export interface LssResource {
  name: string;
  current: number;
  max: number;

  /** Восстанавливается коротким отдыхом. */
  shortRest: boolean;

  /** Восстанавливается продолжительным отдыхом. */
  longRest: boolean;
}

/** Текстовый блок листа LSS: ключ шаблона и документ редактора (TipTap). */
export interface LssTextBlock {
  /** Ключ блока в шаблоне LSS (`traits`, `notes-1`). */
  key: string;

  /** Документ TipTap как он лежит в файле. */
  doc: unknown;
}

/** Потраченные ячейки заклинаний одного круга. */
export interface LssSpellSlot {
  level: number;
  used: number;

  /** Всего ячеек круга по данным LSS. */
  max: number;
}

/** Подпись персонажа из шапки LSS (возраст, рост, мировоззрение). */
export interface LssDetailRow {
  label: string;
  value: string;
}

/**
 * Персонаж из файла Long Story Short, приведённый к плоскому виду. Ключи
 * характеристик, навыков и владений остаются «родными» для LSS — в наши их
 * переводит `convert.ts` по картам из `constants.ts`.
 */
export interface LssCharacter {
  name: string;
  className: string;

  /** Название подкласса; '' — не выбран. */
  subclassName: string;

  /** Название вида как его записал LSS («Человек (викинг)»). */
  speciesName: string;

  backgroundName: string;

  /** Ключ размера LSS (`medium`); '' — не указан. */
  size: string;

  level: number;
  experience: number;

  /** Подписи шапки, которым на нашем листе нет полей (возраст, рост, глаза). */
  details: LssDetailRow[];

  /** Значения характеристик по кодам LSS (`str`). */
  abilities: Record<string, number>;

  /** Коды характеристик, спасбросками которых персонаж владеет. */
  saves: string[];

  /** Владение навыками: ключ LSS → уровень (1 — владение, 2 — компетентность). */
  skills: Record<string, number>;

  health: { current: number; max: number; temporary: number };

  /** Кость хитов: номинал и остаток (максимум считается по уровню). */
  hitDice: { die: number; current: number };

  /** Итоговый класс доспеха с учётом щита. */
  armorClass: number;

  speed: number;
  darkvision: number;
  inspiration: boolean;

  /** Код заклинательной характеристики LSS (`wis`); '' — не задан. */
  spellcastingAbility: string;

  spellSlots: LssSpellSlot[];

  /** Ячейки договора колдуна: у LSS они лежат отдельным блоком. */
  pactSpellSlots: LssSpellSlot[];

  weapons: LssWeapon[];
  resources: LssResource[];

  /** Флаги владений LSS (`armor-light`, `weapon-simple`). */
  proficiencyFlags: string[];

  /** Монеты по кодам LSS (`gp`). */
  coins: Record<string, number>;

  texts: LssTextBlock[];

  /** В файле заведены пользовательские бонусы — на листе им места нет. */
  hasBonuses: boolean;

  /** В файле есть настроенные магические предметы — настройки лист не ведёт. */
  hasAttunements: boolean;
}

/** Итог импорта листа из чужого формата. */
export interface ExternalImportResult {
  /** Персонаж для создания листа. */
  character: Character;

  /** Название формата-источника («Long Story Short»). */
  sourceLabel: string;

  /** Что перенести не удалось — показывается тостом после импорта. */
  warnings: string[];
}
