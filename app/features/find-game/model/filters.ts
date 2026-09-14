import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import type { FilterGroup, FilterGroups } from '~infrastructure/filter';

import type {
  GameCostType,
  GameDurationType,
  GameFilterChip,
  GameSearchFilter,
  GameStatus,
  GameSystem,
  GameSystemOption,
  GameType,
} from './types';

import {
  CATALOG_FILTER_COST_LABEL,
  CATALOG_FILTER_CROSSPLAY_IDS,
  CATALOG_FILTER_CROSSPLAY_LABEL,
  CATALOG_FILTER_CROSSPLAY_VALUES,
  CATALOG_FILTER_DURATION_LABEL,
  CATALOG_FILTER_FAVORITE_LABEL,
  CATALOG_FILTER_FREE_SEATS_MIN,
  CATALOG_FILTER_GROUP_KEYS,
  CATALOG_FILTER_MAX_AGE_LABEL,
  CATALOG_FILTER_MAX_FREE_SEATS_LABEL,
  CATALOG_FILTER_MAX_SEATS_TO_START_LABEL,
  CATALOG_FILTER_MIN_AGE_LABEL,
  CATALOG_FILTER_SEATS_TO_START_MIN,
  CATALOG_FILTER_STATUS_LABEL,
  CATALOG_FILTER_SYSTEM_LABEL,
  CATALOG_FILTER_TYPE_LABEL,
  FAVORITE_GAMES_TAB_LABEL,
  GAME_AGE_MAX,
  GAME_AGE_MIN,
  GAME_COST_TYPE_LABELS,
  GAME_COST_TYPES,
  GAME_DURATION_TYPE_LABELS,
  GAME_DURATION_TYPES,
  GAME_FIELD_CITY_LABEL,
  GAME_PLAYERS_MAX,
  GAME_STATUS_LABELS,
  GAME_STATUSES,
  GAME_TYPE_LABELS,
  GAME_TYPES,
} from './constants';

/** Ключ страницы в адресе каталога. */
const CATALOG_PAGE_QUERY_KEY = 'page';

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

/**
 * Читает флаг-переключатель: в адресе он либо стоит значением `true`, либо
 * его нет вовсе. Трёхзначность здесь не нужна — «не избранное» это и есть
 * обычный каталог.
 * @param value Сырое значение параметра адреса.
 */
function readFlag(value: QueryValue): boolean {
  return readQueryValue(value) === 'true';
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
    crossplayAllowed: null,
    minAge: null,
    maxAge: null,
    maxFreeSeats: null,
    maxSeatsToStart: null,
    favorite: false,
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
    system: [...new Set(readQueryValues(query.system))],
    excludeSystem: [...new Set(readQueryValues(query.excludeSystem))],
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
    crossplayAllowed: readTriStateFlag(query.crossplayAllowed),
    minAge,
    maxAge: hasInvertedRange ? null : maxAge,
    maxFreeSeats: readBoundedInteger(
      query.maxFreeSeats,
      CATALOG_FILTER_FREE_SEATS_MIN,
      GAME_PLAYERS_MAX,
    ),
    maxSeatsToStart: readBoundedInteger(
      query.maxSeatsToStart,
      CATALOG_FILTER_SEATS_TO_START_MIN,
      GAME_PLAYERS_MAX,
    ),
    favorite: readFlag(query.favorite),
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

  // Ноль здесь — полноценное условие («минимум уже набран»), поэтому проверка
  // именно на `null`, а не на пустоту значения.
  if (filter.maxFreeSeats !== null) {
    params.maxFreeSeats = String(filter.maxFreeSeats);
  }

  if (filter.maxSeatsToStart !== null) {
    params.maxSeatsToStart = String(filter.maxSeatsToStart);
  }

  // Выключенный переключатель в адрес не пишется вовсе: `favorite=false` —
  // это обычный каталог, и в ссылке ему делать нечего.
  if (filter.favorite) {
    params.favorite = 'true';
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

/* ------------------------------------------------------------------ */
/* Группы общей панели фильтров и ряд применённых условий              */
/* ------------------------------------------------------------------ */

/** Поле фильтра со списком значений. */
type ListFilterKey = (typeof LIST_FILTER_KEYS)[number];

/** Числовое условие фильтра: границы возраста и мест. */
type NumberFilterKey = 'minAge' | 'maxAge' | 'maxFreeSeats' | 'maxSeatsToStart';

/** Искомые и исключённые значения одной группы. */
interface ChoiceSelection<Value extends string> {
  included: Array<Value>;
  excluded: Array<Value>;
}

/** Значение группы без исключения: избранное и кросспол. */
interface PlainGroupEntry {
  id: string;
  name: string;
  selected: boolean;
}

/**
 * Статусы, по которым отбирается каталог. Отменённая игра в выдачу не
 * попадает вовсе: отбор по ней дал бы пустой каталог, а не «покажи
 * отменённые».
 */
const CATALOG_STATUS_OPTIONS = GAME_STATUSES.filter(
  (status) => status !== 'CANCELLED',
);

/**
 * Строит группу «искать — исключить» из двух половин фильтра.
 *
 * Общая панель сайта исключает сразу всю группу, а фильтр игр хранит обе
 * половины. У перечислений из двух-трёх значений смешанный выбор ничего не
 * добавляет к отбору, поэтому группа исключает, только когда искомых значений
 * нет вовсе.
 *
 * @param key Ключ группы.
 * @param name Заголовок группы.
 * @param options Значения перечисления по порядку.
 * @param labels Подписи значений.
 * @param selection Искомые и исключённые значения.
 */
function toChoiceGroup<Value extends string>(
  key: string,
  name: string,
  options: ReadonlyArray<Value>,
  labels: Record<Value, string>,
  selection: ChoiceSelection<Value>,
): FilterGroup {
  const isExcluding =
    !selection.included.length && selection.excluded.length > 0;

  const picked = new Set<string>(
    isExcluding ? selection.excluded : selection.included,
  );

  return {
    key,
    name,
    type: 'filter',
    supports: { mode: true, union: false },
    mode: isExcluding,
    union: false,
    values: options.map((option) => ({
      id: option,
      value: option,
      name: labels[option],
      selected: picked.has(option) ? true : null,
    })),
  };
}

/**
 * Строит группу без исключения.
 * @param key Ключ группы.
 * @param name Заголовок группы.
 * @param entries Значения группы.
 */
function toPlainGroup(
  key: string,
  name: string,
  entries: Array<PlainGroupEntry>,
): FilterGroup {
  return {
    key,
    name,
    type: 'filter',
    values: entries.map((entry) => ({
      id: entry.id,
      value: entry.id,
      name: entry.name,
      selected: entry.selected ? true : null,
    })),
  };
}

/**
 * Отмеченные значения группы по её ключу.
 * @param groups Группы панели.
 * @param key Ключ группы.
 */
function readSelectedIds(groups: FilterGroups, key: string): Set<string> {
  const group = groups.find((candidate) => candidate.key === key);

  return new Set(
    (group?.values ?? [])
      .filter((filterItem) => filterItem.selected)
      .map((filterItem) => String(filterItem.id)),
  );
}

/**
 * Читает группу «искать — исключить» обратно в две половины фильтра.
 * @param groups Группы панели.
 * @param key Ключ группы.
 * @param options Допустимые значения перечисления.
 */
function readChoiceGroup<Value extends string>(
  groups: FilterGroups,
  key: string,
  options: ReadonlyArray<Value>,
): ChoiceSelection<Value> {
  const selectedIds = readSelectedIds(groups, key);
  const selected = options.filter((option) => selectedIds.has(option));
  const isExcluding = groups.find((group) => group.key === key)?.mode === true;

  return isExcluding
    ? { included: [], excluded: selected }
    : { included: selected, excluded: [] };
}

/**
 * Подписи игровых систем по коду — для групп панели и для чипов.
 * @param systems Справочник игровых систем.
 */
function toSystemLabels(
  systems: ReadonlyArray<GameSystemOption>,
): Record<string, string> {
  return Object.fromEntries(
    systems.map((system): [string, string] => [system.code, system.name]),
  );
}

/**
 * Группы общей панели фильтров сайта из фильтра каталога игр.
 *
 * Город, возраст и места чипами не выражаются — их панель показывает
 * отдельными полями, и в группы они не входят.
 *
 * @param filter Применённый фильтр каталога.
 * @param withFavorite Показывать ли группу избранного: у гостя списка нет, и
 *   сервис вернул бы ему пустой каталог вместо подбора.
 * @param systems Справочник игровых систем: перечисления у них больше нет, и
 *   набор вариантов приходит от сервиса.
 */
export function toGameFilterGroups(
  filter: GameSearchFilter,
  withFavorite: boolean,
  systems: ReadonlyArray<GameSystemOption>,
): FilterGroups {
  const groups: FilterGroups = [
    toChoiceGroup(
      CATALOG_FILTER_GROUP_KEYS.system,
      CATALOG_FILTER_SYSTEM_LABEL,
      systems.map((system) => system.code),
      toSystemLabels(systems),
      { included: filter.system, excluded: filter.excludeSystem },
    ),
    toChoiceGroup(
      CATALOG_FILTER_GROUP_KEYS.type,
      CATALOG_FILTER_TYPE_LABEL,
      GAME_TYPES,
      GAME_TYPE_LABELS,
      { included: filter.type, excluded: filter.excludeType },
    ),
    toChoiceGroup(
      CATALOG_FILTER_GROUP_KEYS.duration,
      CATALOG_FILTER_DURATION_LABEL,
      GAME_DURATION_TYPES,
      GAME_DURATION_TYPE_LABELS,
      { included: filter.durationType, excluded: filter.excludeDurationType },
    ),
    toChoiceGroup(
      CATALOG_FILTER_GROUP_KEYS.cost,
      CATALOG_FILTER_COST_LABEL,
      GAME_COST_TYPES,
      GAME_COST_TYPE_LABELS,
      { included: filter.costType, excluded: filter.excludeCostType },
    ),
    toChoiceGroup(
      CATALOG_FILTER_GROUP_KEYS.status,
      CATALOG_FILTER_STATUS_LABEL,
      CATALOG_STATUS_OPTIONS,
      GAME_STATUS_LABELS,
      { included: filter.status, excluded: filter.excludeStatus },
    ),
    toPlainGroup(
      CATALOG_FILTER_GROUP_KEYS.crossplay,
      CATALOG_FILTER_CROSSPLAY_LABEL,
      [
        {
          id: CATALOG_FILTER_CROSSPLAY_IDS.allowed,
          name: CATALOG_FILTER_CROSSPLAY_VALUES.allowed,
          selected: filter.crossplayAllowed === true,
        },
        {
          id: CATALOG_FILTER_CROSSPLAY_IDS.forbidden,
          name: CATALOG_FILTER_CROSSPLAY_VALUES.forbidden,
          selected: filter.crossplayAllowed === false,
        },
      ],
    ),
  ];

  if (!withFavorite) {
    return groups;
  }

  const favoriteGroup = toPlainGroup(
    CATALOG_FILTER_GROUP_KEYS.favorite,
    FAVORITE_GAMES_TAB_LABEL,
    [
      {
        id: CATALOG_FILTER_GROUP_KEYS.favorite,
        name: CATALOG_FILTER_FAVORITE_LABEL,
        selected: filter.favorite,
      },
    ],
  );

  return [favoriteGroup, ...groups];
}

/**
 * Переносит выбор из групп панели в фильтр каталога. Поля без групп — город,
 * возраст и места — берутся из переданного фильтра как есть.
 * @param filter Фильтр с полями, заданными вне групп.
 * @param groups Группы панели после «Применить».
 * @param systems Справочник игровых систем: по нему отсеиваются коды, которых
 *   в справочнике уже нет.
 */
export function applyGameFilterGroups(
  filter: GameSearchFilter,
  groups: FilterGroups,
  systems: ReadonlyArray<GameSystemOption>,
): GameSearchFilter {
  const system = readChoiceGroup(
    groups,
    CATALOG_FILTER_GROUP_KEYS.system,
    systems.map((option) => option.code),
  );

  const type = readChoiceGroup(
    groups,
    CATALOG_FILTER_GROUP_KEYS.type,
    GAME_TYPES,
  );

  const duration = readChoiceGroup(
    groups,
    CATALOG_FILTER_GROUP_KEYS.duration,
    GAME_DURATION_TYPES,
  );

  const cost = readChoiceGroup(
    groups,
    CATALOG_FILTER_GROUP_KEYS.cost,
    GAME_COST_TYPES,
  );

  const status = readChoiceGroup(
    groups,
    CATALOG_FILTER_GROUP_KEYS.status,
    CATALOG_STATUS_OPTIONS,
  );

  const crossplay = readSelectedIds(
    groups,
    CATALOG_FILTER_GROUP_KEYS.crossplay,
  );

  const isCrossplayAllowed = crossplay.has(
    CATALOG_FILTER_CROSSPLAY_IDS.allowed,
  );

  const isCrossplayForbidden = crossplay.has(
    CATALOG_FILTER_CROSSPLAY_IDS.forbidden,
  );

  return {
    ...filter,
    system: system.included,
    excludeSystem: system.excluded,
    type: type.included,
    excludeType: type.excluded,
    durationType: duration.included,
    excludeDurationType: duration.excluded,
    costType: cost.included,
    excludeCostType: cost.excluded,
    status: status.included,
    excludeStatus: status.excluded,
    // Отмечены оба варианта или ни одного — условие не задано.
    crossplayAllowed:
      isCrossplayAllowed === isCrossplayForbidden ? null : isCrossplayAllowed,
    favorite: readSelectedIds(groups, CATALOG_FILTER_GROUP_KEYS.favorite).has(
      CATALOG_FILTER_GROUP_KEYS.favorite,
    ),
  };
}

/**
 * Чипы одного списка значений фильтра.
 * @param key Поле фильтра.
 * @param values Значения поля.
 * @param getLabel Подпись значения.
 * @param isExcluded Поле исключает значения.
 */
function toListChips<Value extends string>(
  key: ListFilterKey,
  values: ReadonlyArray<Value>,
  getLabel: (value: Value) => string,
  isExcluded: boolean,
): Array<GameFilterChip> {
  return values.map((value) => ({
    key: `${key}:${value}`,
    label: getLabel(value),
    isExcluded,
    remove: (current) => ({
      ...current,
      [key]: current[key].filter((listed) => listed !== value),
    }),
  }));
}

/**
 * Чип числового условия; у незаданного условия чипа нет.
 * @param key Поле фильтра.
 * @param label Подпись условия.
 * @param value Значение условия.
 */
function toNumberChips(
  key: NumberFilterKey,
  label: string,
  value: number | null,
): Array<GameFilterChip> {
  if (value === null) {
    return [];
  }

  return [
    {
      key,
      label: `${label} ${value}`,
      isExcluded: false,
      remove: (current) => ({ ...current, [key]: null }),
    },
  ];
}

/**
 * Подпись чипа кроссплея.
 * @param isAllowed Кросспол разрешён.
 */
function getCrossplayChipLabel(isAllowed: boolean): string {
  const value = isAllowed
    ? CATALOG_FILTER_CROSSPLAY_VALUES.allowed
    : CATALOG_FILTER_CROSSPLAY_VALUES.forbidden;

  return `${CATALOG_FILTER_CROSSPLAY_LABEL}: ${value}`;
}

/**
 * Применённые условия каталога — по чипу на условие. По ряду видно, что отбор
 * включён, и условие снимается одним нажатием, без панели фильтров.
 * @param filter Применённый фильтр каталога.
 * @param systems Справочник игровых систем: названия систем живут там же, где
 *   и сами системы.
 */
export function getGameFilterChips(
  filter: GameSearchFilter,
  systems: ReadonlyArray<GameSystemOption>,
): Array<GameFilterChip> {
  const chips: Array<GameFilterChip> = [];

  if (filter.favorite) {
    chips.push({
      key: CATALOG_FILTER_GROUP_KEYS.favorite,
      label: CATALOG_FILTER_FAVORITE_LABEL,
      isExcluded: false,
      remove: (current) => ({ ...current, favorite: false }),
    });
  }

  const systemLabels = toSystemLabels(systems);

  // Код системы остаётся подписью, пока справочник не подъехал: пустой чип
  // молчал бы о том, что отбор вообще включён.
  const getSystemLabel = (value: GameSystem) => systemLabels[value] ?? value;
  const getTypeLabel = (value: GameType) => GAME_TYPE_LABELS[value];
  const getCostLabel = (value: GameCostType) => GAME_COST_TYPE_LABELS[value];
  const getStatusLabel = (value: GameStatus) => GAME_STATUS_LABELS[value];

  const getDurationLabel = (value: GameDurationType) =>
    GAME_DURATION_TYPE_LABELS[value];

  const getCityLabel = (city: string) => `${GAME_FIELD_CITY_LABEL}: ${city}`;

  chips.push(
    ...toListChips('system', filter.system, getSystemLabel, false),
    ...toListChips('excludeSystem', filter.excludeSystem, getSystemLabel, true),
    ...toListChips('type', filter.type, getTypeLabel, false),
    ...toListChips('excludeType', filter.excludeType, getTypeLabel, true),
    ...toListChips(
      'durationType',
      filter.durationType,
      getDurationLabel,
      false,
    ),
    ...toListChips(
      'excludeDurationType',
      filter.excludeDurationType,
      getDurationLabel,
      true,
    ),
    ...toListChips('costType', filter.costType, getCostLabel, false),
    ...toListChips(
      'excludeCostType',
      filter.excludeCostType,
      getCostLabel,
      true,
    ),
    ...toListChips('status', filter.status, getStatusLabel, false),
    ...toListChips('excludeStatus', filter.excludeStatus, getStatusLabel, true),
    ...toListChips('city', filter.city, getCityLabel, false),
  );

  if (filter.crossplayAllowed !== null) {
    chips.push({
      key: CATALOG_FILTER_GROUP_KEYS.crossplay,
      label: getCrossplayChipLabel(filter.crossplayAllowed),
      isExcluded: false,
      remove: (current) => ({ ...current, crossplayAllowed: null }),
    });
  }

  chips.push(
    ...toNumberChips('minAge', CATALOG_FILTER_MIN_AGE_LABEL, filter.minAge),
    ...toNumberChips('maxAge', CATALOG_FILTER_MAX_AGE_LABEL, filter.maxAge),
    ...toNumberChips(
      'maxFreeSeats',
      CATALOG_FILTER_MAX_FREE_SEATS_LABEL,
      filter.maxFreeSeats,
    ),
    ...toNumberChips(
      'maxSeatsToStart',
      CATALOG_FILTER_MAX_SEATS_TO_START_LABEL,
      filter.maxSeatsToStart,
    ),
  );

  return chips;
}
