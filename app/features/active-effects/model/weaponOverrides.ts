/**
 * Значения замен свойств оружия в окне эффекта: кость урона, характеристика
 * атаки и тип урона («Дубинка»). Зеркало `getWeaponOverrideValueOptions`,
 * `validateWeaponOverrideValue` и `describeWeaponOverrideValue` из
 * `weaponOverrides.ts` VTTG. Расчёт замен по оружию сайту не нужен — его делает
 * лист VTTG.
 */

import {
  ACTIVE_EFFECT_LABELS,
  EFFECT_ABILITY_OPTIONS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  isWeaponOverrideKey,
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
 * Ошибка значения замены свойства оружия — подписью под полем окна эффекта.
 *
 * @param key ключ строки.
 * @param changeValue значение строки.
 * @returns текст ошибки либо `undefined`.
 */
export function validateWeaponOverrideValue(
  key: string,
  changeValue: string,
): string | undefined {
  if (!isWeaponOverrideKey(key)) {
    return undefined;
  }

  const valueOptions = getWeaponOverrideValueOptions(key);

  if (valueOptions) {
    return describeWeaponOverrideValue(key, changeValue) === undefined
      ? ACTIVE_EFFECT_LABELS.changeWeaponOptionError
      : undefined;
  }

  return DICE_LETTER_PATTERN.test(changeValue)
    ? undefined
    : ACTIVE_EFFECT_LABELS.changeWeaponDiceError;
}

/**
 * Подпись значения замены из списка («Заклинательная характеристика»,
 * «Силовое поле»).
 *
 * @param key ключ строки.
 * @param changeValue значение строки.
 * @returns подпись либо `undefined`, если значение не из списка.
 */
export function describeWeaponOverrideValue(
  key: string,
  changeValue: string,
): string | undefined {
  const trimmedValue = changeValue.trim();

  return getWeaponOverrideValueOptions(key)?.find(
    (valueOption) => valueOption.value === trimmedValue,
  )?.label;
}
