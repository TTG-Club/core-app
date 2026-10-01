/**
 * Спасбросок одной из нескольких характеристик на выбор бросающего: «существо
 * совершает спасбросок Силы или Ловкости».
 *
 * Выбирает бросающий, и выбор у него один разумный — характеристика с лучшим
 * спасброском: VTTG берёт её сам. Здесь — запись списка из формы и подпись
 * характеристик для сводки.
 *
 * Зеркало: dnd5-test-migrate/src/engine/saveAbilityChoice.ts
 */

import type { EffectAbility } from './types';

import {
  EFFECT_ABILITY_GENITIVE_LABELS,
  EFFECT_ABILITY_OPTIONS,
  EFFECT_SAVE_ABILITY_CHOICE_JOINER,
} from './constants';

/** Спасбросок с характеристиками на выбор. */
export interface SaveAbilityChoice {
  /** Характеристика спасброска. */
  ability: EffectAbility;
  /** Ещё характеристики на выбор бросающего. */
  altAbilities?: readonly EffectAbility[];
}

/** Подпись характеристики в именительном падеже. */
const ABILITY_LABELS = new Map(
  EFFECT_ABILITY_OPTIONS.map((ability) => [ability.value, ability.label]),
);

/**
 * Характеристики спасброска по порядку записи, без повторов.
 *
 * @param save спасбросок.
 * @returns характеристики; одна — выбора нет.
 */
function listSaveAbilities(save: SaveAbilityChoice): EffectAbility[] {
  return [...new Set([save.ability, ...(save.altAbilities ?? [])])];
}

/**
 * Характеристики на выбор для записи: без основной характеристики спасброска
 * (она названа отдельно) и без пустого списка — поле тогда не пишется.
 *
 * @param ability основная характеристика спасброска.
 * @param pickedAbilities отмеченные автором характеристики.
 * @returns список для поля `altAbilities` либо `undefined`.
 */
export function normalizeAltAbilities(
  ability: EffectAbility,
  pickedAbilities: readonly EffectAbility[],
): EffectAbility[] | undefined {
  const otherAbilities = pickedAbilities.filter(
    (pickedAbility) => pickedAbility !== ability,
  );

  return otherAbilities.length > 0 ? otherAbilities : undefined;
}

/**
 * Характеристики спасброска словами: «Сила или Ловкость».
 *
 * @param save спасбросок.
 * @returns подпись.
 */
export function describeSaveAbilities(save: SaveAbilityChoice): string {
  return listSaveAbilities(save)
    .map((ability) => ABILITY_LABELS.get(ability) ?? ability)
    .join(EFFECT_SAVE_ABILITY_CHOICE_JOINER);
}

/**
 * Характеристики спасброска в родительном падеже: «Силы или Ловкости».
 *
 * @param save спасбросок.
 * @returns подпись.
 */
export function describeSaveAbilitiesGenitive(save: SaveAbilityChoice): string {
  return listSaveAbilities(save)
    .map((ability) => EFFECT_ABILITY_GENITIVE_LABELS[ability])
    .join(EFFECT_SAVE_ABILITY_CHOICE_JOINER);
}
