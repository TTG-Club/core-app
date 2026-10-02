/**
 * Значения строк, которые задают словом из списка или костью, а не формулой:
 * замены свойств оружия — кость урона, характеристика атаки и тип урона
 * («Дубинка») — и тип урона заклинаний на выбор. Зеркало
 * `getWeaponOverrideValueOptions`, `getChangeValueOptions`,
 * `validateChangeOptionValue` и `describeChangeOptionValue` из
 * `weaponOverrides.ts` VTTG. Расчёт замен по оружию сайту не нужен — его делает
 * лист VTTG.
 */

import {
  ACTIVE_EFFECT_LABELS,
  EFFECT_ABILITY_OPTIONS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  isOptionValueKey,
  SPELL_DAMAGE_TYPE_KEY,
  WEAPON_ATTACK_ABILITY_KEY,
  WEAPON_DAMAGE_TYPE_KEY,
  WEAPON_SPELL_ABILITY_LABEL,
  WEAPON_SPELL_ABILITY_VALUE,
} from './constants';

/** Пункт выбора значения замены. */
export interface WeaponOverrideValueOption {
  value: string;
  label: string;
}

/** Буква кости в значении замены. */
const DICE_LETTER_PATTERN = /[кдd]/i;

/**
 * Значения на выбор у замены свойства оружия. Характеристика и тип урона —
 * закрытые списки: формулой их не задать, и опечатка молча оставила бы оружие
 * при своих.
 *
 * @param key ключ строки эффекта.
 * @returns пункты выбора либо `undefined`, если значение набирают сами.
 */
export function getWeaponOverrideValueOptions(
  key: string,
): WeaponOverrideValueOption[] | undefined {
  if (key === WEAPON_ATTACK_ABILITY_KEY) {
    return [
      {
        value: WEAPON_SPELL_ABILITY_VALUE,
        label: WEAPON_SPELL_ABILITY_LABEL,
      },
      ...EFFECT_ABILITY_OPTIONS,
    ];
  }

  if (key === WEAPON_DAMAGE_TYPE_KEY) {
    return EFFECT_DAMAGE_TYPE_OPTIONS;
  }

  return undefined;
}

/**
 * Значения на выбор у строки, чьё значение — слово из списка: замены свойств
 * оружия и тип урона заклинаний.
 *
 * @param key ключ строки эффекта.
 * @returns пункты выбора либо `undefined`, если значение набирают сами.
 */
export function getChangeValueOptions(
  key: string,
): WeaponOverrideValueOption[] | undefined {
  return key === SPELL_DAMAGE_TYPE_KEY
    ? EFFECT_DAMAGE_TYPE_OPTIONS
    : getWeaponOverrideValueOptions(key);
}

/**
 * Ошибка значения строки, которое задают словом из списка или костью (замена
 * свойства оружия, тип урона заклинаний), — подписью под полем окна эффекта.
 *
 * @param key ключ строки.
 * @param changeValue значение строки.
 * @returns текст ошибки либо `undefined`.
 */
export function validateChangeOptionValue(
  key: string,
  changeValue: string,
): string | undefined {
  if (!isOptionValueKey(key)) {
    return undefined;
  }

  const valueOptions = getChangeValueOptions(key);

  if (valueOptions) {
    return describeChangeOptionValue(key, changeValue) === undefined
      ? ACTIVE_EFFECT_LABELS.changeWeaponOptionError
      : undefined;
  }

  return DICE_LETTER_PATTERN.test(changeValue)
    ? undefined
    : ACTIVE_EFFECT_LABELS.changeWeaponDiceError;
}

/**
 * Подпись значения из списка («Заклинательная характеристика», «Силовое
 * поле») у замены свойства оружия и типа урона заклинаний.
 *
 * @param key ключ строки.
 * @param changeValue значение строки.
 * @returns подпись либо `undefined`, если значение не из списка.
 */
export function describeChangeOptionValue(
  key: string,
  changeValue: string,
): string | undefined {
  const trimmedValue = changeValue.trim();

  return getChangeValueOptions(key)?.find(
    (valueOption) => valueOption.value === trimmedValue,
  )?.label;
}
