import type * as MarkdownItNs from 'markdown-it';

import { LEADING_CHARACTER } from '../consts';

// Имя inline-токена, в который заворачивается сырой маркер {@...}.
export const MARKER_TOKEN = 'ttgMarker';

const OPEN_BRACE = 0x7b; // {
const CLOSE_BRACE = 0x7d; // }
const AT_SIGN = LEADING_CHARACTER.charCodeAt(0); // @

/**
 * Находит конец маркера {@...}, начиная с позиции `start`.
 *
 * Балансировка повторяет логику строкового парсера разметки: уровень
 * увеличивается только на паре «{@» (вложенный маркер) и уменьшается на любой
 * «}». Это гарантирует, что подстрока попадёт в тот же `parse()`, что и раньше.
 *
 * @param source - Исходная строка
 * @param start - Индекс открывающей «{» маркера
 * @param max - Верхняя граница поиска (state.posMax)
 * @returns Индекс сразу за закрывающей «}», либо -1, если маркер не закрыт
 */
function findMarkerEnd(source: string, start: number, max: number): number {
  let level = 0;

  for (let pos = start; pos < max; pos++) {
    if (
      source.charCodeAt(pos) === OPEN_BRACE
      && source.charCodeAt(pos + 1) === AT_SIGN
    ) {
      level++;
      pos++;

      continue;
    }

    if (source.charCodeAt(pos) === CLOSE_BRACE) {
      level--;

      if (level === 0) {
        return pos + 1;
      }
    }
  }

  return -1;
}

/**
 * Плагин markdown-it, распознающий кастомные маркеры {@...} как единый
 * inline-токен. Содержимое токена — сырая строка маркера, которую затем
 * разбирает существующий парсер разметки.
 */
export const markerPlugin: MarkdownItNs.PluginSimple = (md) => {
  md.inline.ruler.before('emphasis', MARKER_TOKEN, (state, silent): boolean => {
    const start = state.pos;

    if (
      state.src.charCodeAt(start) !== OPEN_BRACE
      || state.src.charCodeAt(start + 1) !== AT_SIGN
    ) {
      return false;
    }

    const end = findMarkerEnd(state.src, start, state.posMax);

    if (end < 0) {
      return false;
    }

    if (!silent) {
      const token = state.push(MARKER_TOKEN, '', 0);

      token.content = state.src.slice(start, end);
    }

    state.pos = end;

    return true;
  });
};
