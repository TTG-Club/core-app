import type { AbilityKey } from '~/shared/types';

import { ABILITY_KEYS, ABILITY_LABELS } from '~/shared/types';

import {
  BACKGROUND_SOURCE_LABEL_PREFIX,
  BACKGROUND_THREE_ONES_COUNT,
} from './consts';

export interface AbilityBonusOption {
  label: string;
  value: AbilityKey;
  disabled?: boolean;
}

/**
 * Подпись характеристики с бонусом, например «Сила (+2)».
 *
 * @param key - Характеристика.
 * @param bonus - Размер бонуса.
 * @returns Подпись для списка выбора.
 */
export function formatAbilityBonusLabel(
  key: AbilityKey,
  bonus: number,
): string {
  return `${ABILITY_LABELS[key]} (+${bonus})`;
}

/**
 * Подпись источника бонусов предыстории, например «Предыстория: Мудрец».
 *
 * @param backgroundName - Название предыстории.
 * @returns Подпись источника бонусов.
 */
export function getBackgroundSourceLabel(backgroundName: string): string {
  return `${BACKGROUND_SOURCE_LABEL_PREFIX}: ${backgroundName}`;
}

/**
 * Варианты «+1 / +1 / +1» для своей предыстории: все шесть характеристик.
 * Когда три уже выбраны, остальные блокируются, чтобы не набрать лишнего.
 *
 * @param selectedAbilities - Уже выбранные характеристики.
 * @returns Варианты для списка выбора.
 */
export function getThreeOnesAbilityOptions(
  selectedAbilities: ReadonlyArray<AbilityKey>,
): AbilityBonusOption[] {
  const isLimitReached =
    selectedAbilities.length >= BACKGROUND_THREE_ONES_COUNT;

  return ABILITY_KEYS.map((key) => ({
    label: formatAbilityBonusLabel(key, 1),
    value: key,
    disabled: isLimitReached && !selectedAbilities.includes(key),
  }));
}
