import type {
  MarkdownLexerConfiguration,
  MarkdownToken,
  MarkdownTokenizer,
} from '@tiptap/core';

import { findMarkerEnd } from '../../markup/balance';

/** Пустая полезная нагрузка токена (блок-чипу нужны только type+raw). */
const EMPTY_DATA: Record<string, never> = {};

/**
 * Читает имя маркера `{@name …}` (до пробела/`}`) и сверяет со списком имён.
 * Так `{@listfoo}` не пройдёт за `{@list`. Единый предикат для isList/isTable/
 * isQuoteMarkerStart — они отличаются только набором имён.
 *
 * @param source - Строка, потенциально начинающаяся с маркера
 * @param names - Допустимые имена маркера (тип + алиасы)
 */
export function markerNameMatches(
  source: string,
  names: ReadonlySet<string>,
): boolean {
  if (!source.startsWith('{@')) {
    return false;
  }

  let cursor = 2;

  while (
    cursor < source.length
    && source[cursor] !== ' '
    && source[cursor] !== '}'
  ) {
    cursor++;
  }

  // Имя должно завершаться реальным терминатором (пробел/`}`), а не концом
  // строки: `{@list` без закрытия — незавершённый маркер, не начало списка.
  return cursor < source.length && names.has(source.slice(2, cursor));
}

/**
 * Фабрика БЛОЧНОГО markdown-токенайзера для маркера `{@…}`, занимающего строку
 * целиком (список/таблица/цитата/блок-чип). Скелет у всех одинаков: маркер идёт
 * с начала строки, `findMarkerEnd` даёт границу, после `}` допустимы лишь пробелы
 * и перевод строки, затем `buildData` строит полезную нагрузку токена (undefined
 * — маркер невалиден). Вынесено, чтобы 4 блочных токенайзера не дублировали код.
 *
 * @param token - Имя markdown-токена (совпадает с markdownTokenName расширения)
 * @param isStart - Начинается ли строка ИМЕННО с нужного маркера
 * @param buildData - Строит поля токена из сырого маркера (или undefined, если
 *   маркер невалиден — тогда токен не создаётся). По умолчанию — пустой объект
 *   (когда валидность полностью определяется `isStart`, как у блок-чипа).
 */
export function createBlockMarkerTokenizer(
  token: string,
  isStart: (source: string) => boolean,
  buildData: (
    raw: string,
    lexer: MarkdownLexerConfiguration,
  ) => object | undefined = () => EMPTY_DATA,
): MarkdownTokenizer {
  return {
    name: token,
    level: 'block',
    start: (source: string) => {
      if (isStart(source)) {
        return 0;
      }

      const index = source.indexOf('\n{@');

      return index >= 0 && isStart(source.slice(index + 1)) ? index + 1 : -1;
    },
    tokenize: (
      source: string,
      _tokens: MarkdownToken[],
      lexer: MarkdownLexerConfiguration,
    ): MarkdownToken | undefined => {
      if (!isStart(source)) {
        return undefined;
      }

      const end = findMarkerEnd(source);

      if (end < 0) {
        return undefined;
      }

      const trailing = source.slice(end).match(/^[ \t]*(\n+|$)/);

      if (!trailing) {
        return undefined;
      }

      const data = buildData(source.slice(0, end), lexer);

      if (!data) {
        return undefined;
      }

      return {
        type: token,
        raw: source.slice(0, end + trailing[0].length),
        ...data,
      } as MarkdownToken;
    },
  };
}
