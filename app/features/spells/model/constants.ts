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
  { label: 'Добавить мод', value: 'modifier' },
  { label: 'Тип урона', value: 'damage-type' },
  { label: 'Условия', value: 'condition' },
];

export const DEFAULT_SPELL_DAMAGE_FORMULA_TOOL = 'modifier';
export const DEFAULT_SPELL_DAMAGE_FORMULA_TARGET = 'selected';
