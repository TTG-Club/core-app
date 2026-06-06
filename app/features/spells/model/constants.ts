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
