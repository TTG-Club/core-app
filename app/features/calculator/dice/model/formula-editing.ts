import type { DicePreset } from './types';

import { DICE_MAX_COUNT, PRESET_VALUE_PLACEHOLDER } from './constants';

/** Последний элемент формулы вместе с предшествующим знаком или скобкой. */
const LAST_FORMULA_TERM = /(\s*[+\-*/(]\s*)?[^\s+\-*/()]+\)?$/;

/** Модификатор в конце формулы: знак и число. */
const TRAILING_MODIFIER = /([+-])\s*(\d+)$/;

/**
 * Добавляет кость в формулу. Если формула уже кончается такой же костью,
 * увеличивается её количество, иначе кость дописывается слагаемым.
 *
 * @param formula - Текущая формула
 * @param sides - Число граней добавляемой кости
 * @returns Формула с добавленной костью
 *
 * @example
 * appendDie('2d6', 6); // '3d6'
 * appendDie('2d6', 8); // '2d6 + d8'
 */
export function appendDie(formula: string, sides: number): string {
  const trimmed = formula.trimEnd();
  const sameDie = trimmed.match(new RegExp(`(\\d*)[dк]${sides}$`));

  if (sameDie) {
    const count = sameDie[1] ? Number(sameDie[1]) : 1;
    const head = trimmed.slice(0, sameDie.index);

    return `${head}${Math.min(count + 1, DICE_MAX_COUNT)}d${sides}`;
  }

  return trimmed ? `${trimmed} + d${sides}` : `d${sides}`;
}

/**
 * Меняет модификатор в конце формулы на указанную величину.
 * Модификатор, обнулившийся после изменения, убирается целиком.
 *
 * @param formula - Текущая формула
 * @param delta - На сколько изменить модификатор
 * @returns Формула с изменённым модификатором
 *
 * @example
 * changeModifier('2d6 + 4', 1); // '2d6 + 5'
 * changeModifier('2d6 + 1', -1); // '2d6'
 */
export function changeModifier(formula: string, delta: number): string {
  const trimmed = formula.trimEnd();
  const modifier = trimmed.match(TRAILING_MODIFIER);

  if (!modifier) {
    if (!trimmed) {
      return String(delta);
    }

    return delta > 0
      ? `${trimmed} + ${delta}`
      : `${trimmed} - ${Math.abs(delta)}`;
  }

  const sign = modifier[1] === '-' ? -1 : 1;
  const changed = sign * Number(modifier[2]) + delta;
  const head = trimmed.slice(0, modifier.index).trimEnd();

  if (changed === 0) {
    return head;
  }

  if (!head) {
    return String(changed);
  }

  return `${head} ${changed > 0 ? '+' : '-'} ${Math.abs(changed)}`;
}

/**
 * Убирает из формулы последний элемент вместе со знаком перед ним.
 *
 * @param formula - Текущая формула
 * @returns Укороченная формула
 *
 * @example
 * dropLastTerm('2d6 + d8'); // '2d6'
 */
export function dropLastTerm(formula: string): string {
  return formula.trimEnd().replace(LAST_FORMULA_TERM, '').trimEnd();
}

/**
 * Подставляет введённое число в шаблон формулы пресета.
 * У пресета без подстановки формула возвращается как есть.
 *
 * @param preset - Пресет с шаблоном формулы
 * @param value - Число, введённое игроком
 * @returns Готовая формула броска
 *
 * @example
 * fillPresetFormula(attackPreset, 18);
 * // '(d20 + 5 КД 18) * (2d6 + 3) crit (4d6 + 3)'
 */
export function fillPresetFormula(preset: DicePreset, value: number): string {
  return preset.formula.replaceAll(PRESET_VALUE_PLACEHOLDER, String(value));
}
