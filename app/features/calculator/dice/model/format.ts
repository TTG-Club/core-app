import { EMPTY_VALUE_PLACEHOLDER } from './constants';

/** Дробные значения показываются с двумя знаками и русской запятой. */
const decimalFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Проценты показываются с одним знаком после запятой. */
const percentFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Ниже этого процента вместо числа показывается «< 0,1 %». */
const MIN_VISIBLE_PERCENT = 0.1;

/**
 * Форматирует итог броска или среднее: целые — без дробной части,
 * дробные — с двумя знаками после запятой.
 *
 * @param value - Число для показа
 * @returns Отформатированное число
 *
 * @example
 * formatRollNumber(12); // '12'
 * formatRollNumber(12.245); // '12,25'
 */
export function formatRollNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return EMPTY_VALUE_PLACEHOLDER;
  }

  return Number.isInteger(value)
    ? String(value)
    : decimalFormatter.format(value);
}

/**
 * Форматирует вероятность в проценты. Ненулевые, но исчезающе малые
 * вероятности показываются как «< 0,1 %», чтобы не выглядеть невозможными.
 *
 * @param probability - Вероятность от 0 до 1
 * @returns Отформатированный процент
 *
 * @example
 * formatProbability(0.0523); // '5,2 %'
 * formatProbability(0.0002); // '< 0,1 %'
 */
export function formatProbability(probability: number): string {
  const percent = probability * 100;

  if (probability > 0 && percent < MIN_VISIBLE_PERCENT) {
    return `< ${percentFormatter.format(MIN_VISIBLE_PERCENT)} %`;
  }

  return `${percentFormatter.format(percent)} %`;
}
