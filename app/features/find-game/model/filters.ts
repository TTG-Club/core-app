import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import type {
  GameCostType,
  GameDurationType,
  GameSearchFilter,
  GameStatus,
  GameSystem,
  GameType,
} from './types';

import {
  GAME_AGE_MAX,
  GAME_AGE_MIN,
  GAME_COST_TYPES,
  GAME_DURATION_TYPES,
  GAME_STATUSES,
  GAME_SYSTEMS,
  GAME_TYPES,
} from './constants';

/** Ключ страницы в адресе каталога. */
export const CATALOG_PAGE_QUERY_KEY = 'page';

/**
 * Значение параметра адреса. Отсутствующий ключ даёт `undefined`, поэтому он
 * входит в тип наравне с `null` и массивом.
 */
type QueryValue = LocationQuery[string] | undefined;

/**
 * Значения из `route.query` бывают `string | null | (string | null)[]`, поэтому
 * каждое читается через явную проверку на строку И непустоту: пустая строка в
 * адресе (`?city=`) не должна превращаться в фильтр по пустому городу.
 * @param value Сырое значение параметра адреса.
 */
function readQueryValues(value: QueryValue): Array<string> {
  const raw = Array.isArray(value) ? value : [value];

  return (
    raw
      .filter((item): item is string => typeof item === 'string' && !!item)
      // Сервис принимает и повтор параметра, и перечисление через запятую;
      // читаем оба варианта, чтобы адрес из чужих рук не терял условий.
      .flatMap((item) => item.split(','))
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

/**
 * Читает первое значение параметра адреса.
 * @param value Сырое значение параметра адреса.
 */
function readQueryValue(value: QueryValue): string | null {
  return readQueryValues(value)[0] ?? null;
}

/**
 * Оставляет только значения, известные фронту. Незнакомое значение из адреса
 * молча выбрасывается: отправлять его в сервис бессмысленно — он ответит 400 и
 * каталог покажет ошибку вместо выдачи.
 * @param values Значения из адреса.
 * @param allowed Допустимые значения перечисления.
 */
function readEnumValues<Value extends string>(
  values: Array<string>,
  allowed: ReadonlyArray<Value>,
): Array<Value> {
  const known = new Set<string>(allowed);

  return [
    ...new Set(values.filter((value): value is Value => known.has(value))),
  ];
}

/**
 * Читает целое число из адреса в заданных границах.
 * @param value Сырое значение параметра адреса.
 * @param min Нижняя граница включительно.
 * @param max Верхняя граница включительно.
 */
function readBoundedInteger(
  value: QueryValue,
  min: number,
  max: number,
): number | null {
  const raw = readQueryValue(value);

  if (raw === null) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

/**
 * Читает трёхзначный флаг: `true`, `false` или «не важно».
 * @param value Сырое значение параметра адреса.
 */
function readTriStateFlag(value: QueryValue): boolean | null {
  const raw = readQueryValue(value);

  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    return false;
  }

  return null;
}

/** Пустой фильтр каталога — он же состояние после сброса. */
export function createEmptyGameFilter(): GameSearchFilter {
  return {
    system: [],
    excludeSystem: [],
    type: [],
    excludeType: [],
    durationType: [],
    excludeDurationType: [],
    costType: [],
    excludeCostType: [],
    status: [],
    excludeStatus: [],
    city: [],
    excludeCity: [],
    crossplayAllowed: null,
    minAge: null,
    maxAge: null,
  };
}

/**
 * Собирает фильтр из адреса страницы. Всё, что не разобралось, считается не
 * заданным — каталог всегда открывается, даже по битой ссылке.
 * @param query Параметры адреса каталога.
 */
export function parseGameFilterFromQuery(
  query: LocationQuery,
): GameSearchFilter {
  const minAge = readBoundedInteger(query.minAge, GAME_AGE_MIN, GAME_AGE_MAX);
  const maxAge = readBoundedInteger(query.maxAge, GAME_AGE_MIN, GAME_AGE_MAX);

  // Сервис отвергает перевёрнутый диапазон целиком (400 на весь запрос),
  // поэтому в таком адресе оставляем только нижнюю границу.
  const hasInvertedRange =
    minAge !== null && maxAge !== null && minAge > maxAge;

  return {
    system: readEnumValues<GameSystem>(
      readQueryValues(query.system),
      GAME_SYSTEMS,
    ),
    excludeSystem: readEnumValues<GameSystem>(
      readQueryValues(query.excludeSystem),
      GAME_SYSTEMS,
    ),
    type: readEnumValues<GameType>(readQueryValues(query.type), GAME_TYPES),
    excludeType: readEnumValues<GameType>(
      readQueryValues(query.excludeType),
      GAME_TYPES,
    ),
    durationType: readEnumValues<GameDurationType>(
      readQueryValues(query.durationType),
      GAME_DURATION_TYPES,
    ),
    excludeDurationType: readEnumValues<GameDurationType>(
      readQueryValues(query.excludeDurationType),
      GAME_DURATION_TYPES,
    ),
    costType: readEnumValues<GameCostType>(
      readQueryValues(query.costType),
      GAME_COST_TYPES,
    ),
    excludeCostType: readEnumValues<GameCostType>(
      readQueryValues(query.excludeCostType),
      GAME_COST_TYPES,
    ),
    status: readEnumValues<GameStatus>(
      readQueryValues(query.status),
      GAME_STATUSES,
    ),
    excludeStatus: readEnumValues<GameStatus>(
      readQueryValues(query.excludeStatus),
      GAME_STATUSES,
    ),
    city: [...new Set(readQueryValues(query.city))],
    excludeCity: [...new Set(readQueryValues(query.excludeCity))],
    crossplayAllowed: readTriStateFlag(query.crossplayAllowed),
    minAge,
    maxAge: hasInvertedRange ? null : maxAge,
  };
}

/**
 * Читает номер страницы каталога. В адресе страница человеческая (с единицы),
 * внутри и в сервисе — с нуля.
 * @param query Параметры адреса каталога.
 */
export function parseCatalogPageFromQuery(query: LocationQuery): number {
  const page = readBoundedInteger(
    query[CATALOG_PAGE_QUERY_KEY],
    1,
    Number.MAX_SAFE_INTEGER,
  );

  return page === null ? 0 : page - 1;
}

/** Пары «поле фильтра — параметр запроса» для множественных значений. */
const LIST_FILTER_KEYS = [
  'system',
  'excludeSystem',
  'type',
  'excludeType',
  'durationType',
  'excludeDurationType',
  'costType',
  'excludeCostType',
  'status',
  'excludeStatus',
  'city',
  'excludeCity',
] as const satisfies ReadonlyArray<keyof GameSearchFilter>;

/**
 * Собирает непустые части фильтра в плоские параметры.
 * Множественные значения склеиваются запятой — сервис принимает такой вид, а
 * адрес остаётся коротким и читаемым.
 * @param filter Фильтр каталога.
 */
function toFilterParams(filter: GameSearchFilter): Record<string, string> {
  const params: Record<string, string> = {};

  for (const key of LIST_FILTER_KEYS) {
    const values = filter[key];

    if (values.length) {
      params[key] = values.join(',');
    }
  }

  if (filter.crossplayAllowed !== null) {
    params.crossplayAllowed = String(filter.crossplayAllowed);
  }

  if (filter.minAge !== null) {
    params.minAge = String(filter.minAge);
  }

  if (filter.maxAge !== null) {
    params.maxAge = String(filter.maxAge);
  }

  return params;
}

/**
 * Превращает фильтр и страницу в параметры адреса. Пустые значения не
 * попадают в адрес вовсе: чистый каталог должен открываться по чистой ссылке.
 * @param filter Фильтр каталога.
 * @param page Номер страницы с нуля.
 */
export function serializeGameFilterToQuery(
  filter: GameSearchFilter,
  page: number,
): LocationQueryRaw {
  const query: LocationQueryRaw = { ...toFilterParams(filter) };

  if (page > 0) {
    query[CATALOG_PAGE_QUERY_KEY] = String(page + 1);
  }

  return query;
}

/**
 * Превращает фильтр в параметры запроса к сервису. Пагинация серверная:
 * страница и размер уходят вместе с условиями, порядок задаёт сервис.
 * @param filter Фильтр каталога.
 * @param page Номер страницы с нуля.
 * @param size Размер страницы.
 */
export function toGameSearchQuery(
  filter: GameSearchFilter,
  page: number,
  size: number,
): Record<string, string | number> {
  return { ...toFilterParams(filter), page, size };
}

/**
 * Сколько условий задано в фильтре — для счётчика на кнопке фильтров.
 * @param filter Фильтр каталога.
 */
export function countActiveGameFilters(filter: GameSearchFilter): number {
  return Object.keys(toFilterParams(filter)).length;
}

/**
 * Пуст ли фильтр.
 * @param filter Фильтр каталога.
 */
export function isEmptyGameFilter(filter: GameSearchFilter): boolean {
  return countActiveGameFilters(filter) === 0;
}
