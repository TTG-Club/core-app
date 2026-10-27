/**
 * Режим «Вычесть» строки модификатора — только в форме, не в данных.
 *
 * В данных вычитание — это «Добавить» со знаком минус: `add` и `-1к4`. Так его
 * понимают и VTTG, и лист сайта, и выгрузка компендиума, а отдельный режим
 * `subtract` повторял бы `add` и ломал бы им всем разбор. Но автор, которому
 * нужен штраф, ищет слово «Вычесть», а не догадывается про минус. Поэтому
 * форма показывает строку `add` с ведущим минусом как «Вычесть» с числом без
 * минуса, а записывает обратно — снова как `add` с минусом.
 *
 * Зеркало `effectChangeSubtract.ts` из VTTG.
 */

import type { EffectChange, EffectChangeMode } from './types';

/** Режим «Вычесть» в выборе формы. */
export const SUBTRACT_MODE_CHOICE = 'subtract';

/** Выбор режима в форме: режимы данных и «Вычесть». */
export type EffectChangeModeChoice =
  | EffectChangeMode
  | typeof SUBTRACT_MODE_CHOICE;

/**
 * Значение пустой вычитаемой строки. Минус без числа не даёт строке, пока
 * автор стёр поле и набирает новое, превратиться обратно в «Добавить».
 */
const EMPTY_SUBTRACT_VALUE = '-';

/**
 * Знаки, после которых плюс или минус — знак числа, а не сложение:
 * `2*-1`, `max(-1, 2)`.
 */
const UNARY_SIGN_PREDECESSORS: ReadonlySet<string> = new Set([
  '*',
  '/',
  '(',
  ',',
  '+',
  '-',
  '^',
]);

/**
 * Меняет знак у формулы целиком: знак первого слагаемого и каждое сложение
 * или вычитание верхнего уровня. Скобки, функции и множители не трогаются —
 * `1к4+2` становится `-1к4-2`, `max(1, @mod.str)` — `-max(1, @mod.str)`.
 *
 * Меняются только знаки, остальные символы остаются на местах: так смена
 * знака дважды возвращает ту же строку, даже недописанную (`1к4+`), — поле
 * не прыгает, пока автор набирает формулу.
 *
 * @param value формула строки модификатора.
 * @returns формула с противоположным знаком.
 */
export function negateEffectFormula(value: string): string {
  const trimmedFormula = value.trim();

  if (trimmedFormula === '') {
    return '';
  }

  const hasLeadingMinus = trimmedFormula.startsWith('-');

  const unsignedFormula =
    hasLeadingMinus || trimmedFormula.startsWith('+')
      ? trimmedFormula.slice(1)
      : trimmedFormula;

  let depth = 0;
  let previousChar = '';
  let flippedFormula = '';

  for (const char of unsignedFormula) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    }

    const isBinarySign =
      depth === 0
      && (char === '+' || char === '-')
      && previousChar !== ''
      && !UNARY_SIGN_PREDECESSORS.has(previousChar);

    if (isBinarySign) {
      flippedFormula += char === '+' ? '-' : '+';
    } else {
      flippedFormula += char;
    }

    if (char.trim() !== '') {
      previousChar = char;
    }
  }

  return hasLeadingMinus ? flippedFormula : `-${flippedFormula}`;
}

/**
 * Показывается ли строка как «Вычесть»: прибавка, чьё значение начинается с
 * минуса.
 *
 * @param change строка модификатора.
 * @returns `true` для вычитания.
 */
export function isSubtractEffectChange(
  change: Pick<EffectChange, 'mode' | 'value'>,
): boolean {
  return change.mode === 'add' && change.value.trim().startsWith('-');
}

/**
 * Режим строки в выборе формы.
 *
 * @param change строка модификатора.
 * @returns режим данных либо «Вычесть».
 */
export function getEffectChangeModeChoice(
  change: Pick<EffectChange, 'mode' | 'value'>,
): EffectChangeModeChoice {
  return isSubtractEffectChange(change) ? SUBTRACT_MODE_CHOICE : change.mode;
}

/**
 * Значение, которое видит автор: у вычитания — без минуса.
 *
 * @param change строка модификатора.
 * @returns значение для поля формы.
 */
export function getEffectChangeShownValue(
  change: Pick<EffectChange, 'mode' | 'value'>,
): string {
  if (!isSubtractEffectChange(change)) {
    return change.value;
  }

  return change.value.trim() === EMPTY_SUBTRACT_VALUE
    ? ''
    : negateEffectFormula(change.value);
}

/**
 * Записывает набранное в поле значение: у вычитания — со знаком минус.
 *
 * @param change строка модификатора.
 * @param shownValue значение из поля формы.
 * @returns значение для данных.
 */
export function toStoredEffectChangeValue(
  change: Pick<EffectChange, 'mode' | 'value'>,
  shownValue: string,
): string {
  if (!isSubtractEffectChange(change)) {
    return shownValue;
  }

  return shownValue.trim() === ''
    ? EMPTY_SUBTRACT_VALUE
    : negateEffectFormula(shownValue);
}

/**
 * Меняет режим строки по выбору формы. Число в поле при этом остаётся тем
 * же, что видел автор: «Добавить 1к4» → «Вычесть 1к4» → «Умножить 1к4».
 *
 * @param change строка модификатора.
 * @param choice выбранный режим.
 * @returns режим и значение для данных.
 */
export function applyEffectChangeModeChoice(
  change: Pick<EffectChange, 'mode' | 'value'>,
  choice: EffectChangeModeChoice,
): Pick<EffectChange, 'mode' | 'value'> {
  const shownValue = getEffectChangeShownValue(change);

  if (choice === SUBTRACT_MODE_CHOICE) {
    return {
      mode: 'add',
      value:
        shownValue.trim() === ''
          ? EMPTY_SUBTRACT_VALUE
          : negateEffectFormula(shownValue),
    };
  }

  return { mode: choice, value: shownValue };
}
