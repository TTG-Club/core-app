import { SPELL_DAMAGE_FORMULA_SEPARATOR } from './constants';

const SPELL_DAMAGE_FORMULA_TAG_PREFIX = '@';
const SPELL_DAMAGE_FORMULA_DICE_SYMBOL = 'к';

/**
 * Возвращает шаблон поиска кости указанного размера в формуле.
 */
function getSpellDamageFormulaDicePattern(diceValue: number): RegExp {
  return new RegExp(
    `(^|[^\\d])([1-9]\\d*)?${SPELL_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}(?!\\d)`,
  );
}

/**
 * Добавляет кость в формулу или увеличивает количество уже указанной кости.
 */
export function incrementSpellDamageFormulaDice(
  formula: string,
  diceValue: number,
): string {
  const dicePattern = getSpellDamageFormulaDicePattern(diceValue);
  const diceMatch = dicePattern.exec(formula);

  if (!diceMatch) {
    return formula
      ? `${formula}${SPELL_DAMAGE_FORMULA_SEPARATOR}1${SPELL_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`
      : `1${SPELL_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`;
  }

  const diceCount = diceMatch[2] ? Number(diceMatch[2]) : 1;
  const nextDiceCount = diceCount + 1;

  return formula.replace(
    dicePattern,
    `${diceMatch[1]}${nextDiceCount}${SPELL_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`,
  );
}

/**
 * Добавляет тег к формуле без арифметического разделителя.
 */
export function appendSpellDamageFormulaTag(
  formula: string,
  tag: string,
): string {
  return formula
    ? `${formula}${SPELL_DAMAGE_FORMULA_TAG_PREFIX}${tag}`
    : `${SPELL_DAMAGE_FORMULA_TAG_PREFIX}${tag}`;
}

/**
 * Добавляет модификатор к формуле через арифметический разделитель.
 */
export function appendSpellDamageFormulaModifier(
  formula: string,
  modifier: string,
): string {
  return formula
    ? `${formula}${SPELL_DAMAGE_FORMULA_SEPARATOR}${SPELL_DAMAGE_FORMULA_TAG_PREFIX}${modifier}`
    : `${SPELL_DAMAGE_FORMULA_TAG_PREFIX}${modifier}`;
}
