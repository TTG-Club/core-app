import type { ComputedRef, WritableComputedRef } from 'vue';

import type {
  ListPresentationConfig,
  ListPresentationGroupingOption,
  ListPresentationGroupSort,
  ListPresentationItemSort,
  ListPresentationOption,
  ListPresentationSeparatorLabel,
} from '../model';

import { z } from 'zod';

import {
  LIST_PRESENTATION_GROUPING_STORAGE_SUFFIX,
  LIST_PRESENTATION_SORTING_STORAGE_SUFFIX,
} from '../model';

interface ListPresentation<
  TItem,
  TGrouping extends string,
  TSorting extends string,
> {
  grouping: WritableComputedRef<TGrouping>;
  sorting: WritableComputedRef<TSorting>;
  groupField: ComputedRef<string | undefined>;
  groupSort: ComputedRef<ListPresentationGroupSort<TItem>>;
  separatorLabel: ComputedRef<ListPresentationSeparatorLabel | undefined>;
  query: ComputedRef<{ grouping: string; sorting: string }>;
  resetKey: ComputedRef<string>;
  itemSort: ComputedRef<ListPresentationItemSort<TItem> | undefined>;
}

/**
 * Возвращает вариант настройки, соответствующий внешнему значению.
 */
function findPresentationOption<TValue extends string>(
  rawValue: unknown,
  options: Array<ListPresentationOption<TValue>>,
): ListPresentationOption<TValue> | undefined {
  const parsedValue = z.string().safeParse(rawValue);

  if (!parsedValue.success) {
    return undefined;
  }

  return options.find((option) => option.value === parsedValue.data);
}

/**
 * Формирует изолированный ключ хранения настройки раздела.
 */
function getPresentationStorageKey(
  sectionKey: string,
  settingSuffix: string,
): string {
  return `${sectionKey}:${settingSuffix}`;
}

/**
 * Управляет представлением списка и валидирует сохранённые настройки.
 */
export function useListPresentation<
  TItem,
  TGrouping extends string,
  TSorting extends string,
>(
  config: ListPresentationConfig<TItem, TGrouping, TSorting>,
): ListPresentation<TItem, TGrouping, TSorting> {
  const storedGrouping = useLocalStorage<string>(
    getPresentationStorageKey(
      config.sectionKey,
      LIST_PRESENTATION_GROUPING_STORAGE_SUFFIX,
    ),
    config.defaultGrouping,
  );

  const storedSorting = useLocalStorage<string>(
    getPresentationStorageKey(
      config.sectionKey,
      LIST_PRESENTATION_SORTING_STORAGE_SUFFIX,
    ),
    config.defaultSorting,
  );

  const grouping = computed<TGrouping>({
    get: () =>
      findPresentationOption(storedGrouping.value, config.groupingOptions)
        ?.value ?? config.defaultGrouping,
    set: (value) => {
      storedGrouping.value = value;
    },
  });

  const sorting = computed<TSorting>({
    get: () =>
      findPresentationOption(storedSorting.value, config.sortingOptions)?.value
      ?? config.defaultSorting,
    set: (value) => {
      storedSorting.value = value;
    },
  });

  watch(
    [storedGrouping, storedSorting],
    ([groupingValue, sortingValue]) => {
      if (!findPresentationOption(groupingValue, config.groupingOptions)) {
        storedGrouping.value = config.defaultGrouping;
      }

      if (!findPresentationOption(sortingValue, config.sortingOptions)) {
        storedSorting.value = config.defaultSorting;
      }
    },
    { immediate: true },
  );

  const activeGrouping = computed<
    ListPresentationGroupingOption<TItem, TGrouping>
  >(() => {
    return (
      config.groupingOptions.find((option) => option.value === grouping.value)
      ?? config.groupingOptions[0]
    );
  });

  const activeSorting = computed(() => {
    return (
      config.sortingOptions.find((option) => option.value === sorting.value)
      ?? config.sortingOptions[0]
    );
  });

  const itemSort = computed<ListPresentationItemSort<TItem> | undefined>(() => {
    if (activeSorting.value.resolveItemSort) {
      return activeSorting.value.resolveItemSort();
    }

    return activeSorting.value.itemSort;
  });

  const groupField = computed(() => activeGrouping.value?.field);

  const groupSort = computed<ListPresentationGroupSort<TItem>>(() => {
    const configuredGroupSort = activeGrouping.value.groupSort;

    if (typeof configuredGroupSort === 'function') {
      return configuredGroupSort();
    }

    return configuredGroupSort ?? { mode: 'auto' };
  });

  const separatorLabel = computed(() => activeGrouping.value.separatorLabel);

  const query = computed(() => ({
    grouping: activeGrouping.value.apiValue,
    sorting: activeSorting.value.apiValue,
  }));

  const resetKey = computed(() => JSON.stringify(query.value));

  return {
    grouping,
    sorting,
    groupField,
    groupSort,
    separatorLabel,
    query,
    resetKey,
    itemSort,
  };
}
