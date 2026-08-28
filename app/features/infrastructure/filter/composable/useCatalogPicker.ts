import type { LocationQuery } from 'vue-router';

import type { Filter, FilterGroups } from '../types';

import { z } from '~/utils/zod';

import {
  CATALOG_PICKER_PAGE_SIZE,
  CATALOG_PICKER_SEARCH_DEBOUNCE_MS,
} from '../model';
import { parseFilter } from '../schema';
import { buildSearchQuery, getGroupItems, hasTouchedItem } from '../utils';

/** Запись каталога в том виде, в каком её показывает и отдаёт пикер. */
export interface CatalogPickerEntry {
  /** Слаг записи: он же значение поля формы. */
  url: string;

  /** Название на русском — по нему и выбирают. */
  name: string;

  /** Название на английском; пусто — его нет в ответе. */
  nameEng: string;

  /** Подпись источника («PHB»); пусто — источник не пришёл. */
  source: string;
}

/** Раздел каталога, по которому идёт выбор. */
export interface CatalogPickerSection {
  /** Ручка поиска раздела: `/api/v2/spells/search`. */
  searchPath: string;

  /** Ручка фильтров раздела: `/api/v2/spells/filters`. */
  filtersPath: string;

  /** Ключ запроса фильтров: у каждого раздела свой набор. */
  filtersKey: string;

  /**
   * Постоянные параметры запроса раздела: у черт это категории, у предметов —
   * вид. Меняются вместе с формой, поэтому приходят функцией.
   */
  query?: () => Record<string, unknown>;

  /**
   * Начало адреса записи раздела: `/api/v2/item`. По нему поле догружает
   * названия уже выбранного — у формы, приехавшей с сервера, в значении одни
   * слаги, и без догрузки чип показывал бы «shield-phb».
   */
  detailPath?: string;

  /**
   * Закреплённый отбор: ключ группы фильтра → идентификаторы значений.
   *
   * Нужен полю с суженным набором: строка боевого стиля выбирает только из
   * боевых стилей, и весь каталог черт там ни при чём. Отбор проставляется
   * заново после правки фильтров в дровере — снять его нельзя, иначе форма
   * получила бы запись, которой в ней быть не должно.
   */
  preset?: () => Record<string, Array<string>>;
}

/**
 * Ответ поиска раздела: списком либо конвертом `{ value }`.
 *
 * Разбор общий на все разделы: ссылка каталога всюду устроена одинаково —
 * слаг, название и источник, — а поля, которых у раздела нет, читаются пустыми.
 */
const entrySchema = z.object({
  url: z.string(),
  name: z
    .object({
      rus: z.string().catch(''),
      eng: z.string().catch(''),
    })
    .catch({ rus: '', eng: '' }),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .nullish()
    .catch(null),
});

const searchResponseSchema = z
  .union([z.array(entrySchema), z.object({ value: z.array(entrySchema) })])
  .catch([]);

/**
 * Разбор ответа поиска в записи пикера.
 *
 * @param payload сырой ответ ручки поиска.
 * @returns записи каталога; пустой список — ответ не разобран.
 */
function parseEntries(payload: unknown): Array<CatalogPickerEntry> {
  const parsed = searchResponseSchema.parse(payload);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((entry) => ({
    url: entry.url,
    name: entry.name.rus,
    nameEng: entry.name.eng,
    source: entry.source?.name.label ?? '',
  }));
}

/**
 * Проставляет закреплённый отбор в группах фильтра.
 *
 * @param groups группы фильтра.
 * @param preset ключ группы → идентификаторы значений.
 * @returns группы с проставленным отбором.
 */
function withPreset(
  groups: FilterGroups,
  preset: Record<string, Array<string>>,
): FilterGroups {
  return groups.map((group) => {
    const ids = preset[group.key];

    if (!ids?.length) {
      return group;
    }

    const wanted = new Set(ids);

    return {
      ...group,
      values: getGroupItems(group).map((filterItem) =>
        wanted.has(String(filterItem.id))
          ? { ...filterItem, selected: true }
          : filterItem,
      ),
    };
  });
}

/**
 * Поиск по разделу каталога с фильтрами раздела и подгрузкой по страницам.
 *
 * Тем же способом, что и каталог раздела: фильтры приходят отдельной лёгкой
 * ручкой, разбираются общим `parseFilter`, а в запрос уходят через
 * `buildSearchQuery`. Второй разбор фильтров под пикер означал бы второй
 * диалект — и он разошёлся бы с разделом при первой же правке.
 *
 * @param section раздел каталога.
 * @returns состояние выдачи и способы ею управлять.
 */
export function useCatalogPicker(section: CatalogPickerSection) {
  const searchTerm = ref('');

  const debouncedSearch = refDebounced(
    searchTerm,
    CATALOG_PICKER_SEARCH_DEBOUNCE_MS,
  );

  const filterState = ref<Filter | null>(null);

  const entries = ref<Array<CatalogPickerEntry>>([]);
  const isLoadingFirstPage = ref(false);
  const isLoadingMore = ref(false);
  const hasLoadError = ref(false);
  const hasNextPage = ref(false);
  const currentPage = ref(0);

  /**
   * Поколение запроса: ответ устаревшего (игрок успел сменить фильтр или
   * запрос) отбрасывается, иначе две выдачи перемешались бы.
   */
  let requestGeneration = 0;

  const { data: loadedFilter, status: filtersStatus } = useAsyncData(
    section.filtersKey,
    async () => {
      const response = await $fetch<unknown>(section.filtersPath, {
        method: 'GET',
        retry: 0,
      });

      return parseFilter(response);
    },
    { server: false },
  );

  // Фильтры приходят один раз и дальше живут в своём состоянии: игрок правит их
  // в дровере, и перезапись ответом затирала бы его выбор.
  watch(loadedFilter, (value) => {
    if (value && !filterState.value) {
      filterState.value = applyPreset(value);
    }
  });

  /**
   * Проставляет закреплённый отбор раздела.
   *
   * @param filter фильтр раздела.
   * @returns фильтр с проставленным отбором.
   */
  function applyPreset(filter: Filter): Filter {
    const preset = section.preset?.();

    if (!preset) {
      return filter;
    }

    return { ...filter, filters: withPreset(filter.filters, preset) };
  }

  const filterGroups = computed<FilterGroups>(
    () => filterState.value?.filters ?? [],
  );

  const isLoadingFilters = computed(() => filtersStatus.value === 'pending');

  const hasActiveFilters = computed(() =>
    filterGroups.value.some((group) => hasTouchedItem(getGroupItems(group))),
  );

  /** Параметры фильтра в том же виде, в каком их шлёт каталог раздела. */
  const filterQuery = computed<LocationQuery>(() =>
    buildSearchQuery(filterState.value ?? undefined),
  );

  // Перезагрузка по фактическому изменению запроса: иммутабельные обновления
  // фильтра меняют ссылки чаще, чем содержимое.
  const requestKey = computed(() =>
    JSON.stringify([
      filterQuery.value,
      debouncedSearch.value,
      section.query?.(),
    ]),
  );

  /**
   * Параметры одной страницы выдачи.
   *
   * @param page номер страницы с нуля.
   * @returns query-параметры запроса.
   */
  function buildQuery(page: number): Record<string, unknown> {
    const search = debouncedSearch.value.trim();

    return {
      ...filterQuery.value,
      ...(section.query?.() ?? {}),
      page,
      size: CATALOG_PICKER_PAGE_SIZE,
      ...(search ? { search } : {}),
    };
  }

  /**
   * Загружает одну страницу выдачи.
   *
   * @param page номер страницы с нуля.
   * @returns записи страницы.
   */
  async function fetchPage(page: number): Promise<Array<CatalogPickerEntry>> {
    const response = await $fetch<unknown>(section.searchPath, {
      method: 'GET',
      query: buildQuery(page),
      retry: 0,
    });

    return parseEntries(response);
  }

  /** Перезагружает выдачу с первой страницы под текущие фильтры и запрос. */
  async function reload(): Promise<void> {
    const generation = ++requestGeneration;

    isLoadingFirstPage.value = true;
    hasLoadError.value = false;

    try {
      const firstPage = await fetchPage(0);

      if (generation !== requestGeneration) {
        return;
      }

      entries.value = firstPage;
      currentPage.value = 0;
      hasNextPage.value = firstPage.length === CATALOG_PICKER_PAGE_SIZE;
    } catch {
      if (generation !== requestGeneration) {
        return;
      }

      entries.value = [];
      hasNextPage.value = false;
      hasLoadError.value = true;
    } finally {
      if (generation === requestGeneration) {
        isLoadingFirstPage.value = false;
      }
    }
  }

  /** Подгружает следующую страницу текущей выдачи. */
  async function loadNextPage(): Promise<void> {
    if (isLoadingFirstPage.value || isLoadingMore.value || !hasNextPage.value) {
      return;
    }

    const generation = requestGeneration;

    isLoadingMore.value = true;
    hasLoadError.value = false;

    try {
      const nextPage = currentPage.value + 1;
      const pageEntries = await fetchPage(nextPage);

      if (generation !== requestGeneration) {
        return;
      }

      entries.value = [...entries.value, ...pageEntries];
      currentPage.value = nextPage;
      hasNextPage.value = pageEntries.length === CATALOG_PICKER_PAGE_SIZE;
    } catch {
      if (generation === requestGeneration) {
        hasLoadError.value = true;
      }
    } finally {
      isLoadingMore.value = false;
    }
  }

  /** Повторяет неудавшуюся загрузку: первую страницу либо подгрузку хвоста. */
  async function retryLoad(): Promise<void> {
    if (!entries.value.length) {
      await reload();

      return;
    }

    await loadNextPage();
  }

  /**
   * Записывает выбор фильтров из дровера.
   *
   * @param groups группы фильтра с проставленным выбором.
   */
  function applyFilterGroups(groups: FilterGroups): void {
    const current = filterState.value;

    if (current) {
      filterState.value = applyPreset({ ...current, filters: groups });
    }
  }

  /** Сбрасывает выбор фильтров к тому, каким его отдала ручка раздела. */
  function resetFilters(): void {
    const loaded = loadedFilter.value;

    filterState.value = loaded ? applyPreset(loaded) : filterState.value;
  }

  return {
    searchTerm,
    filterGroups,
    isLoadingFilters,
    hasActiveFilters,
    entries,
    isLoadingFirstPage,
    isLoadingMore,
    hasLoadError,
    hasNextPage,
    requestKey,
    reload,
    loadNextPage,
    retryLoad,
    applyFilterGroups,
    resetFilters,
  };
}
