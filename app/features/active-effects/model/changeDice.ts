/**
 * Кость в значении строки модификатора: где её бросают, а где она не значит
 * ничего. Зеркало `isRollTimeDiceKey` и `isDiceFormulaValue` из
 * `effectPipeline.ts` VTTG и проверки значения из `EffectChangeRows.vue`.
 */

import type { EffectChange } from './types';

import { ACTIVE_EFFECT_LABELS } from './constants';

/** Ключ «все проверки характеристик (и навыков)». */
export const ABILITY_CHECK_KEY = 'abilityCheck';

/** Ключ «атаки по носителю: прибавка атакующему». */
const ATTACKS_AGAINST_KEY = 'attacksAgainst';

/** Ключ спасброска от смерти. */
const DEATH_SAVE_KEY = 'deathSave';

/** Приставка ключей урона. */
const DAMAGE_CHANGE_KEY_PREFIX = 'damage.';

/** Приставки ключей, у которых кость катается в самом броске. */
const ROLL_BONUS_KEY_PREFIXES = ['attack.', 'save.', 'skill.'] as const;

/** Кубиковая нотация в значении строки («2к6», «1d4», «к8»). */
const DICE_VALUE_REGEX = /\d*\s*[кдd]\s*\d+/i;

/**
 * Есть ли в значении строки кость, а не только число.
 *
 * @param value значение строки модификатора.
 * @returns `true`, если в значении кубиковая нотация.
 */
export function isDiceFormulaValue(value: string): boolean {
  return DICE_VALUE_REGEX.test(value);
}

/**
 * Бросается ли кость в строке с этим ключом: урон, атака, спасбросок, проверка
 * или навык. У прочих ключей («Класс доспеха», скорость) кость не бросает
 * никто — такая строка не значит ничего, и форма говорит об этом автору.
 *
 * @param key ключ изменения.
 * @returns `true`, если кость в значении строки катается при броске.
 */
export function isRollTimeDiceKey(key: string): boolean {
  return (
    key === ATTACKS_AGAINST_KEY
    || key === ABILITY_CHECK_KEY
    || key === DEATH_SAVE_KEY
    || key.startsWith(DAMAGE_CHANGE_KEY_PREFIX)
    || ROLL_BONUS_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

/**
 * Кость к броску атаки, спасброска или проверки. У урона кость — отдельная
 * часть урона, пояснение «бросается заново» к ней не относится.
 *
 * @param change строка модификатора.
 * @returns `true`, если кость катается в самом броске.
 */
export function isRollDiceEffectChange(
  change: Pick<EffectChange, 'key' | 'mode' | 'value'>,
): boolean {
  return (
    !change.key.startsWith(DAMAGE_CHANGE_KEY_PREFIX)
    && change.mode === 'add'
    && isRollTimeDiceKey(change.key)
    && isDiceFormulaValue(change.value)
  );
}

/**
 * Ошибка значения строки модификатора. Кость числом не считается: её катает
 * бросок — если он у ключа вообще есть. Кость в «Классе доспеха» VTTG молча
 * пропустил бы. Строку без ключа не проверяем: о ней говорит поле ключа.
 *
 * @param change строка модификатора.
 * @returns текст ошибки либо `undefined`.
 */
export function describeEffectChangeValueError(
  change: Pick<EffectChange, 'key' | 'mode' | 'value'>,
): string | undefined {
  if (!change.value.trim()) {
    return ACTIVE_EFFECT_LABELS.changeValueRequired;
  }

  if (!change.key.trim() || !isDiceFormulaValue(change.value)) {
    return undefined;
  }

  if (!isRollTimeDiceKey(change.key)) {
    return ACTIVE_EFFECT_LABELS.changeDiceNotRolledError;
  }

  return change.mode === 'add'
    ? undefined
    : ACTIVE_EFFECT_LABELS.changeDiceModeError;
}
