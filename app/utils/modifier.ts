/**
 * Получение модификатора значения характеристики.
 *
 * @param ability значение характеристики.
 * @returns модификатор характеристики.
 */
export function getModifier(ability: number): number {
  return Math.floor((ability - 10) / 2);
}

/**
 * Получение значения модификатора без знака.
 *
 * @param ability значение характеристики.
 * @returns абсолютное значение модификатора.
 */
export function getABSModifier(ability: number): number {
  return Math.abs(getModifier(ability));
}

/**
 * Получение знака перед модификатором.
 *
 * @param ability значение характеристики.
 * @returns знак модификатора ('+' или '−').
 */
export function getSign(ability: number): string {
  return Math.sign(getModifier(ability)) > -1 ? '+' : '−';
}

/**
 * Получение модификатора со знаком.
 *
 * @param ability значение характеристики.
 * @returns отформатированный модификатор (например, '+2' или '−1').
 */
export function getFormattedModifier(ability: number): string {
  return `${getSign(ability)}${getABSModifier(ability)}`;
}

/**
 * Форматирование готового бонуса со знаком. В отличие от
 * {@link getFormattedModifier} на вход идёт уже посчитанный бонус, а не значение
 * характеристики: так одинаково подписываются бонусы предметов, умений и
 * настроек листа.
 *
 * @param bonus значение бонуса.
 * @returns отформатированный бонус (например, '+4' или '−1').
 */
export function getFormattedBonus(bonus: number): string {
  return `${bonus < 0 ? '−' : '+'}${Math.abs(bonus)}`;
}

/**
 * Получение формулы броска из значения характеристики.
 *
 * @param ability значение характеристики.
 * @param dice значение кубика.
 * @returns формула броска характеристики (например, '1к20+2').
 */
export function getFormula(ability: number, dice: number = 20): string {
  return `1к${dice}${getSign(ability)}${getABSModifier(ability)}`;
}
