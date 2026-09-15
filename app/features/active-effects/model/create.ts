/**
 * Сборка новых эффектов: пустой эффект для места формы и эффект состояния по
 * шаблону.
 */

import type { EffectConditionTemplate } from './constants';
import type { EffectFormContext } from './layout';
import type { ActiveEffect, EffectConditionKey, EffectOrigin } from './types';

import { EFFECT_CONDITION_TEMPLATES, EFFECT_NEW_NAME } from './constants';
import { createEffectForContext } from './layout';
import { DEFAULT_EFFECT_ICON, EFFECT_ORIGIN } from './types';

/** Приставка ключа эффекта: по ней в данных видно, чей это ключ. */
const EFFECT_ID_PREFIX = 'effect';

/**
 * Создаёт новый эффект для места формы: доставка по умолчанию уже выбрана
 * (`createEffectForContext`) — у заклинания и действия существа эффект сразу
 * «на цели», у черты и предмета — на носителе.
 *
 * @param origin чем эффект выдан.
 * @param context место формы.
 * @returns новый эффект.
 */
export function createEmptyActiveEffect(
  origin: EffectOrigin,
  context: EffectFormContext,
): ActiveEffect {
  return {
    ...createEffectForContext(
      context,
      createEntityId(EFFECT_ID_PREFIX),
      EFFECT_NEW_NAME,
      origin,
    ),
    icon: DEFAULT_EFFECT_ICON,
  };
}

/**
 * Шаблон стандартного состояния по ключу. У Истощения шаблона нет — его
 * модификаторы зависят от степени.
 *
 * @param conditionKey ключ состояния.
 * @returns шаблон либо `undefined`, если шаблона нет.
 */
export function findEffectConditionTemplate(
  conditionKey: EffectConditionKey,
): EffectConditionTemplate | undefined {
  return EFFECT_CONDITION_TEMPLATES.find(
    (conditionTemplate) => conditionTemplate.key === conditionKey,
  );
}

/**
 * Эффект состояния по шаблону: то, что состояние делает, — название, описание,
 * иконка, модификаторы, флаги и иммунитеты. Зеркало
 * `buildConditionActiveEffect` системы; Истощения среди шаблонов нет — его
 * модификаторы зависят от степени.
 *
 * @param conditionKey ключ состояния.
 * @returns эффект состояния либо `null`, если шаблона нет.
 */
export function buildConditionActiveEffect(
  conditionKey: EffectConditionKey,
): ActiveEffect | null {
  const template = findEffectConditionTemplate(conditionKey);

  if (!template) {
    return null;
  }

  return {
    id: createEntityId(EFFECT_ID_PREFIX),
    name: template.name,
    description: template.description,
    icon: template.icon,
    disabled: false,
    origin: EFFECT_ORIGIN.condition,
    transfer: false,
    duration: { type: 'permanent' },
    changes: template.changes.map((change) => ({ ...change })),
    flags: [...template.flags],
    conditionKey: template.key,
    conditionImmunities: template.conditionImmunities
      ? [...template.conditionImmunities]
      : undefined,
  };
}
