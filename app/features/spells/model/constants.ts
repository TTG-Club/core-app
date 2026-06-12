import type { SpellSaveEffect, SpellTargetType } from './create';

interface SpellSelectOption<Value extends string> {
  label: string;
  value: Value;
}

export const SPELL_TARGET_TYPE_OPTIONS: Array<
  SpellSelectOption<SpellTargetType>
> = [
  { label: 'Существо', value: 'CREATURE' },
  { label: 'Предмет', value: 'OBJECT' },
  { label: 'Точка', value: 'POINT' },
  { label: 'На себя', value: 'SELF' },
  { label: 'Область', value: 'AREA' },
  { label: 'Нет цели', value: 'NONE' },
];

export const SPELL_SAVE_EFFECT_OPTIONS: Array<
  SpellSelectOption<SpellSaveEffect>
> = [
  { label: 'Половина урона', value: 'HALF' },
  { label: 'Нет урона', value: 'NONE' },
  { label: 'Особый', value: 'SPECIAL' },
];

export const SPELL_DAMAGE_TYPE_TAGS: Record<string, string> = {
  ACID: 'dmg.acid',
  BLUDGEONING: 'dmg.bludgeoning',
  COLD: 'dmg.cold',
  FAIR: 'dmg.fire',
  FIRE: 'dmg.fire',
  FORCE: 'dmg.force',
  LIGHTNING: 'dmg.lightning',
  NECROTIC: 'dmg.necrotic',
  PIERCING: 'dmg.piercing',
  POISON: 'dmg.poison',
  PSYCHIC: 'dmg.psychic',
  RADIANT: 'dmg.radiant',
  SLASHING: 'dmg.slashing',
  THUNDER: 'dmg.thunder',
};

export const SPELL_HEALING_TYPE_TAGS: Record<string, string> = {
  HEALING: 'heal',
  TEMPORARY_HIT: 'heal.temp',
  TEMPORARY_HITPOINTS: 'heal.temp',
};

export const SPELL_DAMAGE_FORMULA_HEALING_TAGS = [
  { label: 'Лечение', value: 'heal' },
  { label: 'Временные ХП', value: 'heal.temp' },
];

export const SPELL_DAMAGE_FORMULA_DICE = [
  { label: 'к4', value: 4 },
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
  { label: 'к20', value: 20 },
];

export const SPELL_DAMAGE_FORMULA_SEPARATOR = '+';

export const SPELL_DAMAGE_FORMULA_CONDITION_TAGS = [
  { label: 'Полное HP', value: 'target.full' },
  { label: 'Неполное HP', value: 'target.notFull' },
];

export const SPELL_DAMAGE_FORMULA_MODIFIER_TAGS = [
  { label: 'Заклинание', value: 'mod.spell' },
  { label: 'Сила', value: 'mod.str' },
  { label: 'Ловкость', value: 'mod.dex' },
  { label: 'Телосложение', value: 'mod.con' },
  { label: 'Интеллект', value: 'mod.int' },
  { label: 'Мудрость', value: 'mod.wis' },
  { label: 'Харизма', value: 'mod.cha' },
  { label: 'Мастерство', value: 'prof' },
  { label: 'Уровень', value: 'level' },
];

export const SPELL_DAMAGE_FORMULA_TARGET_OPTIONS = [
  { label: 'Выбранная цель', value: 'selected' },
  { label: 'На себя', value: 'target.self' },
  { label: 'Указать отдельно', value: 'target.separate' },
];

export const SPELL_DAMAGE_FORMULA_TOOLS = [
  { label: 'Кости', value: 'dice' },
  { label: 'Тип урона', value: 'damage-type' },
  { label: 'Лечение', value: 'healing' },
  { label: 'Условия', value: 'condition' },
  { label: 'Добавить мод', value: 'modifier' },
];

export const DEFAULT_SPELL_DAMAGE_FORMULA_TOOL = 'modifier';
export const DEFAULT_SPELL_DAMAGE_FORMULA_TARGET = 'selected';
