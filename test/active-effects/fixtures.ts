import type {
  ActiveEffect,
  EffectAura,
  EffectChange,
  EffectDamagePart,
  EffectFormContext,
  EffectFormLayout,
  EffectSave,
} from '~active-effects/model';

import { resolveEffectFormLayout } from '~active-effects/model';

/** Сложность спасброска эффектов в тестах. */
export const SAVE_DC = 13;

/** Приоритет модификатора по умолчанию. */
export const DEFAULT_PRIORITY = 20;

/** Радиус ауры в тестах. */
export const AURA_RADIUS = 10;

/** Спасбросок Телосложения с половиной урона при успехе. */
export const CONSTITUTION_SAVE: EffectSave = {
  ability: 'constitution',
  dc: SAVE_DC,
  onSuccess: 'half',
};

/** Яд 2к6. */
export const POISON_DAMAGE: EffectDamagePart[] = [
  { formula: '2d6', type: 'poison' },
];

/** Модификатор скорости ходьбы. */
export const WALK_SPEED_CHANGE: EffectChange = {
  key: 'movement.walk',
  mode: 'add',
  value: '10',
  priority: DEFAULT_PRIORITY,
};

/** Аура союзникам. */
export const ALLIES_AURA: EffectAura = {
  radius: AURA_RADIUS,
  target: 'allies',
  applyToSelf: true,
  visible: true,
};

/** Аура на всех существ. */
export const ALL_CREATURES_AURA: EffectAura = {
  radius: AURA_RADIUS,
  target: 'all',
  applyToSelf: false,
  visible: true,
};

/**
 * Эффект в форме редактора.
 *
 * @param overrides поля, отличные от умолчания.
 * @returns эффект.
 */
export function createEffect(
  overrides: Partial<ActiveEffect> = {},
): ActiveEffect {
  return {
    id: 'effect_test',
    name: 'Тест',
    description: '',
    disabled: false,
    origin: 'manual',
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags: [],
    ...overrides,
  };
}

/**
 * Раскладка формы для эффекта.
 *
 * @param context место формы.
 * @param overrides поля эффекта.
 * @returns раскладка.
 */
export function resolveLayoutFor(
  context: EffectFormContext,
  overrides: Partial<ActiveEffect> = {},
): EffectFormLayout {
  return resolveEffectFormLayout(context, createEffect(overrides));
}

/**
 * Эффект как данные: без ключей со значением `undefined`.
 *
 * @param effect эффект.
 * @returns JSON.
 */
export function serializeEffect(effect: ActiveEffect): string {
  return JSON.stringify(effect);
}
