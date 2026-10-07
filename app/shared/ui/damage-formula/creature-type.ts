/**
 * Типы существ в формуле урона: токен `@target.type.undead` — условие на своё
 * слагаемое, как и токены состояний. «2к6@dmg.radiant@target.type.undead»
 * добавляет 2к6 излучением только по нежити.
 *
 * Зеркало токенов типа существа из `formulaTokens.ts` системы VTTG.
 */

import { uniq } from 'es-toolkit';

import {
  DAMAGE_FORMULA_CREATURE_TYPE_RECIPIENT_LABELS,
  DAMAGE_FORMULA_CREATURE_TYPE_RECIPIENT_PREFIX,
  DAMAGE_FORMULA_LIST_LOCALE,
} from './constants';

/** Все токены типа существа в формуле; ключ типа — латиница. */
const DAMAGE_FORMULA_CREATURE_TYPE_TOKENS_PATTERN = /@target\.type\.([a-z]+)/gi;

/** Перечисление типов существ словами: «исчадиям, нежити и феям». */
const creatureTypeListFormat = new Intl.ListFormat(DAMAGE_FORMULA_LIST_LOCALE, {
  style: 'long',
  type: 'conjunction',
});

/**
 * Типы существ из токенов формулы — каждый один раз, в порядке появления.
 *
 * @param formula формула части урона.
 * @returns ключи типов существ (`undead`); пусто — урон достаётся любой цели.
 */
export function listDamageFormulaCreatureTypes(formula: string): Array<string> {
  return uniq(
    [...formula.matchAll(DAMAGE_FORMULA_CREATURE_TYPE_TOKENS_PATTERN)].flatMap(
      ([, creatureType]) => (creatureType ? [creatureType.toLowerCase()] : []),
    ),
  );
}

/**
 * Подпись типов существ, которым достаётся урон: «по исчадиям и нежити».
 * Незнакомый ключ отдаётся как есть — так опечатка видна.
 *
 * @param creatureTypes ключи типов существ.
 * @returns подпись; пустая строка — типов нет.
 */
export function describeDamageFormulaCreatureTypes(
  creatureTypes: Array<string>,
): string {
  if (!creatureTypes.length) {
    return '';
  }

  const recipientLabels = creatureTypes.map(
    (creatureType) =>
      DAMAGE_FORMULA_CREATURE_TYPE_RECIPIENT_LABELS[creatureType]
      ?? creatureType,
  );

  return `${DAMAGE_FORMULA_CREATURE_TYPE_RECIPIENT_PREFIX}${creatureTypeListFormat.format(recipientLabels)}`;
}
