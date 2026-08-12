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
