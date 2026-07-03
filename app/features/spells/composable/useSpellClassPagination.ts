import type { ComputedRef, Ref } from 'vue';
import type { LocationQuery } from 'vue-router';

import type { Filter } from '~infrastructure/filter/types';

import type {
  SpellClassPageGroup,
  SpellLinkResponse,
  SpellSearchResponse,
} from '../model';

import {
  SPELL_CLASS_GROUP_PAGE_SIZE,
  SPELL_WITHOUT_CLASS_GROUP_KEY,
  SPELL_WITHOUT_CLASS_GROUP_LABEL,
} from '../model';

interface SpellClassPaginationOptions {
  filter: Ref<Filter | undefined>;
  filterQuery: ComputedRef<LocationQuery>;
  isActive: ComputedRef<boolean>;
  search: Ref<string | undefined>;
  sorting: ComputedRef<string>;
}

interface SpellClassPagination {
  groups: Ref<Array<SpellClassPageGroup>>;
  isLoading: Ref<boolean>;
  hasError: Ref<boolean>;
  loadedSpells: ComputedRef<Array<SpellLinkResponse>>;
  loadNextPage: (classKey: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface SpellClassDefinition {
  key: string;
  label: string;
}

/** Возвращает классы, которые должны отображаться с учётом фильтра классов. */
function getClassDefinitions(
  filter: Filter | undefined,
): Array<SpellClassDefinition> {
  const classFilterGroup = filter?.filters.find(
    (filterGroup) => filterGroup.key === 'className',
  );

  const classFilterValues = classFilterGroup?.values ?? [];

  const selectedClassValues = classFilterValues.filter(
    (filterValue) => filterValue.selected,
  );

  let visibleClassValues = selectedClassValues;

  if (selectedClassValues.length === 0) {
    visibleClassValues = classFilterValues;
  } else if (classFilterGroup?.mode) {
    visibleClassValues = classFilterValues.filter(
      (filterValue) => !filterValue.selected,
    );
  }

  const definitions = visibleClassValues.map((filterValue) => ({
    key: String(filterValue.id),
    label: filterValue.name,
  }));

  if (selectedClassValues.length > 0 && !classFilterGroup?.mode) {
    return definitions;
  }

  return [
    ...definitions,
    {
      key: SPELL_WITHOUT_CLASS_GROUP_KEY,
      label: SPELL_WITHOUT_CLASS_GROUP_LABEL,
    },
  ];
}

/** Нормализует ответ поиска заклинаний к массиву. */
function getSpellPageValues(
  response: SpellSearchResponse,
): Array<SpellLinkResponse> {
  return Array.isArray(response) ? response : response.value;
}

/** Управляет независимыми страницами заклинаний для каждой группы класса. */
export function useSpellClassPagination(
  options: SpellClassPaginationOptions,
): SpellClassPagination {
  const groups = ref<Array<SpellClassPageGroup>>([]);
  const isLoading = ref(false);
  const hasError = ref(false);

  let refreshGeneration = 0;

  /** Неизменно обновляет состояние указанной группы. */
  function updateGroup(
    classKey: string,
    transform: (group: SpellClassPageGroup) => SpellClassPageGroup,
  ): void {
    groups.value = groups.value.map((classGroup) =>
      classGroup.key === classKey ? transform(classGroup) : classGroup,
    );
  }

  /** Загружает страницу конкретной группы класса. */
  async function fetchGroupPage(
    classKey: string,
    page: number,
  ): Promise<Array<SpellLinkResponse>> {
    const response = await $fetch<SpellSearchResponse>(
      '/api/v2/spells/search',
      {
        method: 'GET',
        query: {
          page,
          size: SPELL_CLASS_GROUP_PAGE_SIZE,
          grouping: 'NONE',
          sorting: options.sorting.value,
          ...(options.search.value ? { search: options.search.value } : {}),
          ...options.filterQuery.value,
          classGroup: classKey,
        },
      },
    );

    return getSpellPageValues(response);
  }

  /** Загружает следующую страницу выбранной группы. */
  async function loadNextPage(classKey: string): Promise<void> {
    const currentGroup = groups.value.find(
      (classGroup) => classGroup.key === classKey,
    );

    if (!currentGroup || currentGroup.isLoading || !currentGroup.hasNextPage) {
      return;
    }

    updateGroup(classKey, (classGroup) => ({
      ...classGroup,
      isLoading: true,
      hasError: false,
    }));

    try {
      const nextPage =
        currentGroup.hasError && !currentGroup.spells.length
          ? 0
          : currentGroup.page + 1;

      const nextSpells = await fetchGroupPage(classKey, nextPage);

      updateGroup(classKey, (classGroup) => ({
        ...classGroup,
        spells: [...classGroup.spells, ...nextSpells],
        page: nextPage,
        hasNextPage: nextSpells.length === SPELL_CLASS_GROUP_PAGE_SIZE,
        isLoading: false,
      }));
    } catch {
      updateGroup(classKey, (classGroup) => ({
        ...classGroup,
        isLoading: false,
        hasError: true,
      }));
    }
  }

  /** Пересоздаёт группы и загружает первую страницу каждой из них. */
  async function refresh(): Promise<void> {
    const currentGeneration = ++refreshGeneration;

    if (!options.isActive.value) {
      groups.value = [];
      isLoading.value = false;
      hasError.value = false;

      return;
    }

    const definitions = getClassDefinitions(options.filter.value);

    isLoading.value = true;
    hasError.value = false;

    groups.value = definitions.map((definition) => ({
      ...definition,
      spells: [],
      page: 0,
      hasNextPage: true,
      isLoading: true,
      hasError: false,
    }));

    await Promise.all(
      definitions.map(async (definition) => {
        try {
          const firstSpells = await fetchGroupPage(definition.key, 0);

          if (currentGeneration !== refreshGeneration) {
            return;
          }

          updateGroup(definition.key, (classGroup) => ({
            ...classGroup,
            spells: firstSpells,
            hasNextPage: firstSpells.length === SPELL_CLASS_GROUP_PAGE_SIZE,
            isLoading: false,
          }));
        } catch {
          if (currentGeneration !== refreshGeneration) {
            return;
          }

          hasError.value = true;

          updateGroup(definition.key, (classGroup) => ({
            ...classGroup,
            isLoading: false,
            hasError: true,
          }));
        }
      }),
    );

    if (currentGeneration === refreshGeneration) {
      groups.value = groups.value.filter(
        (classGroup) => classGroup.spells.length > 0 || classGroup.hasError,
      );

      isLoading.value = false;
    }
  }

  const loadedSpells = computed(() => {
    const uniqueSpells = new Map<string, SpellLinkResponse>();

    groups.value.forEach((classGroup) => {
      classGroup.spells.forEach((spell) => uniqueSpells.set(spell.url, spell));
    });

    return Array.from(uniqueSpells.values());
  });

  watch(
    [
      options.isActive,
      options.search,
      options.filter,
      options.filterQuery,
      options.sorting,
    ],
    refresh,
    { deep: true, immediate: true },
  );

  return {
    groups,
    isLoading,
    hasError,
    loadedSpells,
    loadNextPage,
    refresh,
  };
}
