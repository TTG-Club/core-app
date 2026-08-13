import type { SelectOption } from '~/shared/types';

import type { FeatChoiceType } from './mechanics';

/** Классовые умения, которых может требовать черта. */
export const CLASS_FEATURE_REQUIREMENT_OPTIONS: Array<SelectOption> = [
  { label: 'Использование заклинаний', value: 'SPELLCASTING' },
  { label: 'Магия договора', value: 'PACT_MAGIC' },
  { label: 'Боевой стиль', value: 'FIGHTING_STYLE' },
  { label: 'Оружейные приёмы', value: 'WEAPON_MASTERY' },
];

/** Что игрок выбирает при взятии черты. */
export const FEAT_CHOICE_TYPE_OPTIONS: Array<SelectOption> = [
  { label: 'Характеристика', value: 'ABILITY' },
  { label: 'Спасбросок', value: 'SAVING_THROW' },
  { label: 'Навык', value: 'SKILL' },
  { label: 'Инструмент', value: 'TOOL' },
  { label: 'Язык', value: 'LANGUAGE' },
  { label: 'Тип урона', value: 'DAMAGE_TYPE' },
  { label: 'Заклинание', value: 'SPELL' },
  { label: 'Заговор', value: 'CANTRIP' },
  { label: 'Список заклинаний', value: 'SPELL_LIST' },
  { label: 'Заклинательная характеристика', value: 'SPELLCASTING_ABILITY' },
  { label: 'Оружие', value: 'WEAPON' },
  { label: 'Вариант из описания', value: 'OPTION' },
];

/**
 * Что даёт сделанный выбор. Компетентность удваивает бонус мастерства, поэтому
 * это отдельный исход, а не «владение посильнее».
 */
export const FEAT_CHOICE_GRANT_OPTIONS: Array<SelectOption> = [
  { label: 'Владение', value: 'PROFICIENCY' },
  { label: 'Компетентность', value: 'EXPERTISE' },
];

/**
 * Типы выборов, у которых есть уровень владения: только им осмысленны
 * ограничения пула по уже имеющемуся владению. Язык и оружие сюда входят
 * («выберите язык, которого вы не знаете», «оружие, которым вы не владеете»),
 * а тип урона или заклинание — нет: владения у них не бывает.
 */
export const PROFICIENCY_FEAT_CHOICE_TYPES: Array<FeatChoiceType> = [
  'SKILL',
  'TOOL',
  'SAVING_THROW',
  'LANGUAGE',
  'WEAPON',
];

/**
 * Типы выборов, которые могут дать компетентность. Она удваивает бонус
 * мастерства в проверке, поэтому бывает только у навыков и инструментов: ни у
 * спасброска, ни у языка, ни у оружия удваивать нечего.
 */
export const EXPERTISE_FEAT_CHOICE_TYPES: Array<FeatChoiceType> = [
  'SKILL',
  'TOOL',
];

/** Типы выборов, которым нужен фильтр заклинаний. */
export const SPELL_FEAT_CHOICE_TYPES: Array<FeatChoiceType> = [
  'SPELL',
  'CANTRIP',
];

/** Чувства, которые может дать черта. */
export const FEAT_SENSE_OPTIONS: Array<SelectOption> = [
  { label: 'Тёмное зрение', value: 'DARKVISION' },
  { label: 'Слепое зрение', value: 'BLINDSIGHT' },
  { label: 'Истинное зрение', value: 'TRUESIGHT' },
  { label: 'Чувство вибрации', value: 'TREMORSENSE' },
];

/** Время накладывания для фильтра заклинаний. */
export const FEAT_CASTING_TIME_OPTIONS: Array<SelectOption> = [
  { label: 'Действие', value: 'ACTION' },
  { label: 'Бонусное действие', value: 'BONUS' },
  { label: 'Реакция', value: 'REACTION' },
  { label: 'Ритуал', value: 'RITUAL' },
  { label: 'Минута', value: 'MINUTE' },
  { label: 'Час', value: 'HOUR' },
];

/**
 * Есть ли у выбираемого уровень владения: только тогда осмысленны ограничения
 * пула «только с владением» и «только без владения».
 *
 * @param type тип выбора; у незаполненного выбора ответ отрицательный.
 * @returns признак выбора с уровнем владения.
 */
export function isProficiencyChoiceType(
  type: FeatChoiceType | undefined,
): boolean {
  return !!type && PROFICIENCY_FEAT_CHOICE_TYPES.includes(type);
}

/**
 * Может ли выбор дать компетентность — безусловную или взамен уже имеющегося
 * владения.
 *
 * @param type тип выбора; у незаполненного выбора ответ отрицательный.
 * @returns признак выбора, у которого бывает компетентность.
 */
export function isExpertiseChoiceType(
  type: FeatChoiceType | undefined,
): boolean {
  return !!type && EXPERTISE_FEAT_CHOICE_TYPES.includes(type);
}

/**
 * Нужен ли выбору фильтр заклинаний.
 *
 * @param type тип выбора; у незаполненного выбора ответ отрицательный.
 * @returns признак выбора заклинания или заговора.
 */
export function isSpellChoiceType(type: FeatChoiceType | undefined): boolean {
  return !!type && SPELL_FEAT_CHOICE_TYPES.includes(type);
}
