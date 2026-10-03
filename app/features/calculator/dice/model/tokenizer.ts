import type { FormulaKeywordToken, FormulaToken } from './types';

import { PERCENTILE_DIE_SIDES } from './constants';

/**
 * Ключевые слова формулы и токены, в которые они превращаются.
 * Порядок важен: слова проверяются сверху вниз, поэтому более длинные
 * варианты должны идти раньше своих префиксов.
 */
const FORMULA_KEYWORDS: ReadonlyArray<readonly [string, FormulaKeywordToken]> =
  [
    ['kh', 'keepHighest'],
    ['kl', 'keepLowest'],
    ['dc', 'difficultyClass'],
    ['сл', 'difficultyClass'],
    ['ac', 'armorClass'],
    ['кд', 'armorClass'],
    ['crit', 'critical'],
    ['крит', 'critical'],
    ['save', 'save'],
    ['half', 'half'],
  ];

/** Знаки арифметики и скобки, у каждого свой токен. */
const FORMULA_SYMBOLS: Readonly<Record<string, FormulaKeywordToken>> = {
  '+': 'plus',
  '-': 'minus',
  '*': 'multiply',
  '/': 'divide',
  '(': 'parenOpen',
  ')': 'parenClose',
};

/**
 * Приводит формулу к единому виду перед разбором: нижний регистр,
 * латинские знаки умножения и минуса, латинская `d` вместо русской «к».
 *
 * Русская «к» заменяется только перед числом или знаком процента, поэтому
 * «2к6» становится «2d6», а слово «кд» в «кд 15» остаётся нетронутым.
 *
 * @param source - Исходная формула
 * @returns Формула в нормализованном виде
 */
function normalizeFormula(source: string): string {
  return source
    .toLowerCase()
    .replace(/[×x]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/к(?=\d|%)/g, 'd');
}

/**
 * Ищет ключевое слово формулы, начинающееся с указанной позиции.
 *
 * @param source - Нормализованная формула
 * @param position - Позиция, с которой начинается поиск
 * @returns Найденное слово и его токен либо null
 */
function matchKeyword(
  source: string,
  position: number,
): readonly [string, FormulaKeywordToken] | null {
  for (const keyword of FORMULA_KEYWORDS) {
    if (source.startsWith(keyword[0], position)) {
      return keyword;
    }
  }

  return null;
}

/**
 * Разбирает формулу на токены.
 *
 * @param source - Формула, введённая пользователем
 * @returns Массив токенов в порядке следования
 * @throws Error с человекочитаемым сообщением, если формула пуста или содержит непонятный символ
 *
 * @example
 * tokenizeFormula('2к6+4');
 * // [{ type: 'integer', value: 2 }, { type: 'dice' }, { type: 'integer', value: 6 },
 * //  { type: 'plus' }, { type: 'integer', value: 4 }]
 */
export function tokenizeFormula(source: string): FormulaToken[] {
  const normalized = normalizeFormula(source);
  const tokens: FormulaToken[] = [];

  let position = 0;

  while (position < normalized.length) {
    const symbol = normalized[position];

    if (symbol === undefined || /\s/.test(symbol)) {
      position += 1;

      continue;
    }

    const symbolToken = FORMULA_SYMBOLS[symbol];

    if (symbolToken) {
      tokens.push({ type: symbolToken });
      position += 1;

      continue;
    }

    if (/\d/.test(symbol)) {
      let end = position;

      while (end < normalized.length && /\d/.test(normalized[end] ?? '')) {
        end += 1;
      }

      tokens.push({
        type: 'integer',
        value: Number(normalized.slice(position, end)),
      });

      position = end;

      continue;
    }

    const keyword = matchKeyword(normalized, position);

    if (keyword) {
      tokens.push({ type: keyword[1] });
      position += keyword[0].length;

      continue;
    }

    if (symbol === 'd') {
      tokens.push({ type: 'dice' });

      if (normalized[position + 1] === '%') {
        tokens.push({ type: 'integer', value: PERCENTILE_DIE_SIDES });
        position += 2;
      } else {
        position += 1;
      }

      continue;
    }

    if (symbol === 'r') {
      tokens.push({ type: 'reroll' });
      position += 1;

      continue;
    }

    throw new Error(`Непонятный символ «${symbol}»`);
  }

  if (!tokens.length) {
    throw new Error('Пустая формула');
  }

  return tokens;
}
