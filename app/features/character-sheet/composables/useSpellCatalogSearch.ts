import type { ComputedRef, Ref } from 'vue';
import type { LocationQuery } from 'vue-router';

import type {
  Filter,
  FilterGroup,
  FilterGroups,
  FilterItem,
} from '~infrastructure/filter';

import type {
  SpellCatalogItem,
  SpellCatalogPreset,
  SpellClassOption,
} from '../model';

import {
  buildSearchQuery,
  getGroupItems,
  getSelectedItemIds,
  hasTouchedItem,
  normalizeDependentSelections,
  parseFilter,
} from '~infrastructure/filter';

import {
  parseSpellCatalog,
  SPELL_CATALOG_GROUPING,
  SPELL_CATALOG_PAGE_SIZE,
  SPELL_CATALOG_SEARCH_DEBOUNCE_MS,
  SPELL_CATALOG_SORTING,
  SPELLS_FILTERS_PATH,
  SPELLS_SEARCH_PATH,
} from '../model';

interface SpellCatalogSearch {
  searchTerm: Ref<string>;
  selectedLevels: ComputedRef<Set<number>>;
  selectedClassIds: ComputedRef<Set<string>>;
  onlyConcentration: ComputedRef<boolean>;
  onlyRitual: ComputedRef<boolean>;
  hasActiveFilters: ComputedRef<boolean>;
  classOptions: ComputedRef<SpellClassOption[]>;
  filterGroups: ComputedRef<FilterGroups>;
  spells: Ref<SpellCatalogItem[]>;
  isLoadingFirstPage: Ref<boolean>;
  isLoadingMore: Ref<boolean>;
  hasLoadError: Ref<boolean>;
  hasNextPage: Ref<boolean>;
  toggleLevel: (level: number) => void;
  toggleClassId: (classId: string) => void;
  toggleConcentration: () => void;
  toggleRitual: () => void;
  applyFilterGroups: (groups: FilterGroups) => void;
  resetFilterSelections: () => void;
  resetFilters: () => void;
  loadNextPage: () => Promise<void>;
  retryLoad: () => Promise<void>;
}

/** Ключи групп фильтров заклинаний, вынесенных в быстрые чипы модалки. */
const LEVEL_GROUP_KEY = 'level';
const CLASS_GROUP_KEY = 'className';
const CONCENTRATION_GROUP_KEY = 'concentration';
const RITUAL_GROUP_KEY = 'ritual';

/** Идентификатор единственного значения флаговых групп (`ritual` и т. п.). */
const FLAG_VALUE_ID = '1';

/**
 * Отмечает выбранными значения группы, прошедшие проверку. Остальные значения
 * не трогаются: пресет только доставляет выбор, а не сбрасывает чужой.
 *
 * @param group группа фильтра.
 * @param isPreset значение входит в пресет.
 * @returns копия группы с проставленным выбором.
 */
function selectGroupItems(
  group: FilterGroup,
  isPreset: (filterItem: FilterItem) => boolean,
): FilterGroup {
  return {
    ...group,
    values: getGroupItems(group).map((filterItem) =>
      isPreset(filterItem) ? { ...filterItem, selected: true } : filterItem,
    ),
  };
}

/**
 * Проставляет пресет в загруженных фильтрах: доступные персонажу круги и его
 * класс. Класс сопоставляется строго по слагу — им же сервер помечает значения
 * группы `className`; совпадения нет (класс не заклинатель, скрыт настройкой
 * источников) — группа остаётся нетронутой.
 *
 * @param filter фильтры из ответа сервера.
 * @param preset начальный выбор кругов и класса.
 * @returns копия фильтров с проставленным выбором.
 */
function applyCatalogPreset(
  filter: Filter,
  preset: SpellCatalogPreset,
): Filter {
  const presetLevelIds = new Set(preset.levels.map(String));

  return {
    ...filter,
    filters: filter.filters.map((group) => {
      if (group.key === LEVEL_GROUP_KEY && presetLevelIds.size) {
        return selectGroupItems(group, (filterItem) =>
          presetLevelIds.has(String(filterItem.id)),
        );
      }

      if (group.key === CLASS_GROUP_KEY && preset.classUrl) {
        return selectGroupItems(
          group,
          (filterItem) => String(filterItem.id) === preset.classUrl,
        );
      }

      return group;
    }),
  };
}

/**
 * Постраничный поиск по каталогу заклинаний для модалки добавления.
 *
 * Повторяет подход раздела «Заклинания»: фильтры и поиск уходят на сервер,
 * страницы подгружаются по мере скролла — весь каталог целиком не выкачивается.
 *
 * Состояние фильтра одно на быстрые чипы и дровер «Все фильтры»: чипы — это
 * ярлыки к группам `level`/`className`/`concentration`/`ritual`, поэтому выбор
 * в дровере подсвечивает чипы и наоборот.
 *
 * @param preset начальный выбор кругов и класса; не задан — каталог открывается
 * без фильтров.
 */
export function useSpellCatalogSearch(
  preset?: SpellCatalogPreset,
): SpellCatalogSearch {
  const searchTerm = ref('');

  const filterState = ref<Filter | undefined>(undefined);

  const spells = ref<SpellCatalogItem[]>([]);

  const isLoadingFirstPage = ref(true);

  const isLoadingMore = ref(false);

  const hasLoadError = ref(false);

  const hasNextPage = ref(false);

  const currentPage = ref(0);

  /**
   * Фактический поисковый запрос текущей выдачи: может отличаться от ввода,
   * если сработал фолбэк неверной раскладки («ашкуифдд» → «fireball»).
   */
  let effectiveSearch = '';

  /**
   * Поколение запроса: ответы устаревших запросов (пользователь успел сменить
   * фильтры или поиск) отбрасываются, чтобы не перемешивать выдачи.
   */
  let requestGeneration = 0;

  /**
   * Query последней запущенной загрузки: заезд дефолтов фильтра в состояние
   * тоже меняет query, но эту загрузку уже ведёт `loadInitialPage`.
   */
  let loadedQueryJson: string | null = null;

  // Полный набор групп фильтров — лёгкий запрос вместо полного каталога.
  const filtersRequest = useAsyncData(
    'character-sheet:spell-filters',
    async () => {
      const response = await $fetch<unknown>(SPELLS_FILTERS_PATH, {
        method: 'GET',
        retry: 0,
      });

      return parseFilter(response);
    },
    { server: false },
  );

  const filterGroups = computed<FilterGroups>(
    () => filterState.value?.filters ?? [],
  );

  /** Возвращает группу фильтра по ключу. */
  function findFilterGroup(groupKey: string) {
    return filterGroups.value.find((group) => group.key === groupKey);
  }

  const selectedLevels = computed(() => {
    const levelGroup = findFilterGroup(LEVEL_GROUP_KEY);

    return new Set(
      levelGroup ? getSelectedItemIds(levelGroup).map(Number) : [],
    );
  });

  const selectedClassIds = computed(() => {
    const classGroup = findFilterGroup(CLASS_GROUP_KEY);

    return new Set(classGroup ? getSelectedItemIds(classGroup) : []);
  });

  const onlyConcentration = computed(() => {
    const concentrationGroup = findFilterGroup(CONCENTRATION_GROUP_KEY);

    return Boolean(
      concentrationGroup && getSelectedItemIds(concentrationGroup).length,
    );
  });

  const onlyRitual = computed(() => {
    const ritualGroup = findFilterGroup(RITUAL_GROUP_KEY);

    return Boolean(ritualGroup && getSelectedItemIds(ritualGroup).length);
  });

  const classOptions = computed<SpellClassOption[]>(() => {
    const classGroup = findFilterGroup(CLASS_GROUP_KEY);

    if (!classGroup) {
      return [];
    }

    return getGroupItems(classGroup)
      .filter((classItem) => classItem.name)
      .map((classItem) => ({
        id: String(classItem.id),
        name: classItem.name,
      }));
  });

  const hasActiveFilters = computed(
    () =>
      Boolean(searchTerm.value.trim())
      || filterGroups.value.some((group) =>
        hasTouchedItem(getGroupItems(group)),
      ),
  );

  // Источники в модалке не редактируются, но в запрос уходят: их выбор —
  // глобальная настройка профиля, которую бэкенд проставляет в ответе фильтров.
  const catalogFilterQuery = computed<LocationQuery>(() =>
    buildSearchQuery(filterState.value),
  );

  // Перезагрузка по фактическому изменению query (сравнение по JSON):
  // иммутабельные обновления фильтра меняют ссылки чаще, чем содержимое.
  const catalogFilterQueryJson = computed(() =>
    JSON.stringify(catalogFilterQuery.value),
  );

  /** Собирает query-параметры страницы каталога с учётом активных фильтров. */
  function buildCatalogQuery(
    page: number,
    search: string,
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {
      ...catalogFilterQuery.value,
      page,
      size: SPELL_CATALOG_PAGE_SIZE,
      grouping: SPELL_CATALOG_GROUPING,
      sorting: SPELL_CATALOG_SORTING,
    };

    if (search) {
      query.search = search;
    }

    return query;
  }

  /** Загружает одну страницу каталога. */
  async function fetchCatalogPage(
    page: number,
    search: string,
  ): Promise<SpellCatalogItem[]> {
    const response = await $fetch<unknown>(SPELLS_SEARCH_PATH, {
      method: 'GET',
      query: buildCatalogQuery(page, search),
      retry: 0,
    });

    return parseSpellCatalog(response);
  }

  /** Перезагружает выдачу с первой страницы под текущие фильтры и поиск. */
  async function reload(): Promise<void> {
    const generation = ++requestGeneration;

    loadedQueryJson = catalogFilterQueryJson.value;

    isLoadingFirstPage.value = true;
    hasLoadError.value = false;

    try {
      const trimmedSearch = searchTerm.value.trim();

      let firstPage = await fetchCatalogPage(0, trimmedSearch);

      let appliedSearch = trimmedSearch;

      // Пустая выдача по запросу в неверной раскладке — пробуем конверсию.
      // Общее правило описано в `withLayoutFallback`, но сам хелпер здесь не
      // подходит: поиск асинхронный, а конвертированный запрос нужно запомнить
      // в `appliedSearch`, чтобы по нему шла дальнейшая пагинация.
      if (!firstPage.length && trimmedSearch) {
        const layoutSearch = convertKeyboardLayout(trimmedSearch);

        if (layoutSearch !== trimmedSearch) {
          const layoutPage = await fetchCatalogPage(0, layoutSearch);

          if (layoutPage.length) {
            firstPage = layoutPage;
            appliedSearch = layoutSearch;
          }
        }
      }

      if (generation !== requestGeneration) {
        return;
      }

      effectiveSearch = appliedSearch;
      spells.value = firstPage;
      currentPage.value = 0;
      hasNextPage.value = firstPage.length === SPELL_CATALOG_PAGE_SIZE;
    } catch {
      if (generation !== requestGeneration) {
        return;
      }

      spells.value = [];
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

      const pageSpells = await fetchCatalogPage(nextPage, effectiveSearch);

      if (generation !== requestGeneration) {
        return;
      }

      spells.value = [...spells.value, ...pageSpells];
      currentPage.value = nextPage;
      hasNextPage.value = pageSpells.length === SPELL_CATALOG_PAGE_SIZE;
    } catch {
      if (generation === requestGeneration) {
        hasLoadError.value = true;
      }
    } finally {
      isLoadingMore.value = false;
    }
  }

  /** Повторяет неудавшуюся загрузку: первую страницу или подгрузку хвоста. */
  async function retryLoad(): Promise<void> {
    if (!spells.value.length) {
      await reload();

      return;
    }

    await loadNextPage();
  }

  /** Переключает выбор значения в группе фильтра иммутабельным обновлением. */
  function toggleFilterValue(groupKey: string, valueId: string): void {
    const currentFilter = filterState.value;

    if (!currentFilter) {
      return;
    }

    filterState.value = {
      ...currentFilter,
      filters: currentFilter.filters.map((group) => {
        if (group.key !== groupKey) {
          return group;
        }

        return {
          ...group,
          values: getGroupItems(group).map((filterItem) =>
            String(filterItem.id) === valueId
              ? { ...filterItem, selected: filterItem.selected ? null : true }
              : filterItem,
          ),
        };
      }),
    };
  }

  /** Переключает чип круга заклинания. */
  function toggleLevel(level: number): void {
    toggleFilterValue(LEVEL_GROUP_KEY, String(level));
  }

  /** Переключает чип класса по идентификатору значения фильтра. */
  function toggleClassId(classId: string): void {
    toggleFilterValue(CLASS_GROUP_KEY, classId);
  }

  /** Переключает чип «Концентрация». */
  function toggleConcentration(): void {
    toggleFilterValue(CONCENTRATION_GROUP_KEY, FLAG_VALUE_ID);
  }

  /** Переключает чип «Ритуал». */
  function toggleRitual(): void {
    toggleFilterValue(RITUAL_GROUP_KEY, FLAG_VALUE_ID);
  }

  /** Применяет группы из дровера «Все фильтры» с нормализацией каскада. */
  function applyFilterGroups(groups: FilterGroups): void {
    const currentFilter = filterState.value;

    if (!currentFilter) {
      return;
    }

    filterState.value = {
      ...currentFilter,
      filters: normalizeDependentSelections(groups),
    };
  }

  /** Сбрасывает выбор во всех группах фильтра, не трогая поиск. */
  function resetFilterSelections(): void {
    const currentFilter = filterState.value;

    if (!currentFilter) {
      return;
    }

    filterState.value = {
      ...currentFilter,
      filters: currentFilter.filters.map((group) => ({
        ...group,
        mode: false,
        union: false,
        values: getGroupItems(group).map((filterItem) => ({
          ...filterItem,
          selected: null,
        })),
      })),
    };
  }

  /** Полный сброс: поиск и все группы фильтра. */
  function resetFilters(): void {
    searchTerm.value = '';
    resetFilterSelections();
  }

  /** Перезагружает выдачу под новые фильтры, пропуская уже загруженный query. */
  function handleFilterQueryChange(queryJson: string): void {
    if (queryJson !== loadedQueryJson) {
      void reload();
    }
  }

  /**
   * Первая загрузка каталога. Ждёт фильтры: их ответ несёт глобальный выбор
   * источников (профиль → «Настройка источников»), иначе первая выдача пришла
   * бы по всем книгам. Ошибка фильтров каталог не блокирует — тогда поиск идёт
   * без ограничения по источникам (и без пресета: проставлять его не во что).
   */
  async function loadInitialPage(): Promise<void> {
    await filtersRequest;

    // Рабочая копия фильтра инициализируется из загруженных дефолтов один раз;
    // дальнейшие правки иммутабельны, поэтому кешированный ответ не мутируется.
    if (filtersRequest.data.value) {
      filterState.value = preset
        ? applyCatalogPreset(filtersRequest.data.value, preset)
        : filtersRequest.data.value;
    }

    await reload();
  }

  // Вотчеры не объединены сознательно: фильтры перезагружают выдачу сразу,
  // а поисковый ввод — с дебаунсом, чтобы не дёргать сервер на каждый символ.
  watch(catalogFilterQueryJson, handleFilterQueryChange);

  watchDebounced(searchTerm, reload, {
    debounce: SPELL_CATALOG_SEARCH_DEBOUNCE_MS,
  });

  onMounted(loadInitialPage);

  return {
    searchTerm,
    selectedLevels,
    selectedClassIds,
    onlyConcentration,
    onlyRitual,
    hasActiveFilters,
    classOptions,
    filterGroups,
    spells,
    isLoadingFirstPage,
    isLoadingMore,
    hasLoadError,
    hasNextPage,
    toggleLevel,
    toggleClassId,
    toggleConcentration,
    toggleRitual,
    applyFilterGroups,
    resetFilterSelections,
    resetFilters,
    loadNextPage,
    retryLoad,
  };
}
