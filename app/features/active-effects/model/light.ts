/**
 * Свет эффекта к записи: значения по умолчанию в данных не пишутся.
 */

import type { EffectLightAnimation } from './types';

import { DEFAULT_EFFECT_LIGHT_COLOR } from './constants';
import { EFFECT_LIGHT_STEADY_ANIMATION } from './types';

/**
 * Цвет света к записи: белый — значение по умолчанию, его нет в данных.
 *
 * @param pickedColor цвет из формы `#rrggbb` в любом регистре.
 * @returns цвет либо `undefined` для белого и пустого.
 */
export function toStoredEffectLightColor(
  pickedColor: string | undefined,
): string | undefined {
  return pickedColor && pickedColor.toLowerCase() !== DEFAULT_EFFECT_LIGHT_COLOR
    ? pickedColor
    : undefined;
}

/**
 * Анимация света к записи: ровный свет — отсутствие анимации.
 *
 * @param pickedAnimation анимация из формы.
 * @returns анимация либо `undefined` для ровного света.
 */
export function toStoredEffectLightAnimation(
  pickedAnimation: EffectLightAnimation | undefined,
): EffectLightAnimation | undefined {
  return pickedAnimation === EFFECT_LIGHT_STEADY_ANIMATION
    ? undefined
    : pickedAnimation;
}
