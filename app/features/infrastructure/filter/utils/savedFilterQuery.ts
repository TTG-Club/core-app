import type { LocationQuery } from 'vue-router';

import { z } from 'zod';

import { SECTION_FILTER_STORE_KEY_PREFIX } from '#shared/consts';

import { getFilterKey } from './getFilterKey';

/** Содержимое куки фильтра: объект, иначе — пустой выбор. */
const savedFilterQuerySchema = z.record(z.string(), z.unknown()).catch({});

/** Значение параметра фильтра: строка или список строк. */
const savedFilterValueSchema = z.union([z.string(), z.array(z.string())]);

/**
 * Имя куки, в которой запомнен выбор фильтра раздела.
 *
 * @param key ключ раздела — с префиксом `filter-` или без него.
 * @returns имя куки.
 */
export function getFilterCookieName(key: string): string {
  return `${SECTION_FILTER_STORE_KEY_PREFIX}${getFilterKey(key)}`;
}

/**
 * Читает запомненный фильтр из куки. В куку может попасть что угодно,
 * поэтому берутся только строки и списки строк.
 *
 * @param value содержимое куки.
 * @returns параметры фильтра в виде параметров адреса.
 */
export function parseSavedFilterQuery(value: unknown): LocationQuery {
  return Object.fromEntries(
    Object.entries(savedFilterQuerySchema.parse(value)).flatMap(
      ([queryKey, queryValue]) => {
        const parsed = savedFilterValueSchema.safeParse(queryValue);

        return parsed.success ? [[queryKey, parsed.data]] : [];
      },
    ),
  );
}

/**
 * Разбирает параметр адреса со списком через запятую (например, `source` —
 * акронимы источников). Берётся только непустая строка, пустые куски
 * отбрасываются.
 *
 * @param value значение параметра адреса.
 * @returns элементы списка или `undefined`, если ничего не выбрано.
 */
export function parseQueryList(value: unknown): Array<string> | undefined {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  const listItems = value.split(',').filter(Boolean);

  return listItems.length > 0 ? listItems : undefined;
}
