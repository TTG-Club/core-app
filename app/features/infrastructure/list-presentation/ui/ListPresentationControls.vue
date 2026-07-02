<script
  setup
  lang="ts"
  generic="TItem, TGrouping extends string, TSorting extends string"
>
  import type {
    ListPresentationConfig,
    ListPresentationOption,
  } from '../model';

  import { z } from 'zod';

  import {
    LIST_PRESENTATION_GROUPING_LABEL,
    LIST_PRESENTATION_SORTING_LABEL,
  } from '../model';

  const props = defineProps<{
    config: ListPresentationConfig<TItem, TGrouping, TSorting>;
  }>();

  const grouping = defineModel<TGrouping>('grouping', { required: true });
  const sorting = defineModel<TSorting>('sorting', { required: true });

  const groupingItems = computed<Array<ListPresentationOption<string>>>(() =>
    props.config.groupingOptions.map(({ label, value, apiValue }) => ({
      label,
      value,
      apiValue,
    })),
  );

  const sortingItems = computed<Array<ListPresentationOption<string>>>(() =>
    props.config.sortingOptions.map(({ label, value, apiValue }) => ({
      label,
      value,
      apiValue,
    })),
  );

  /**
   * Применяет выбранную группировку после проверки значения компонента.
   */
  function handleGroupingUpdate(rawValue: unknown): void {
    const parsedValue = z.string().safeParse(rawValue);

    if (!parsedValue.success) {
      return;
    }

    const selectedOption = props.config.groupingOptions.find(
      (option) => option.value === parsedValue.data,
    );

    if (selectedOption) {
      grouping.value = selectedOption.value;
    }
  }

  /**
   * Применяет выбранную сортировку после проверки значения компонента.
   */
  function handleSortingUpdate(rawValue: unknown): void {
    const parsedValue = z.string().safeParse(rawValue);

    if (!parsedValue.success) {
      return;
    }

    const selectedOption = props.config.sortingOptions.find(
      (option) => option.value === parsedValue.data,
    );

    if (selectedOption) {
      sorting.value = selectedOption.value;
    }
  }
</script>

<template>
  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
    <USelect
      v-if="props.config.groupingOptions.length > 1"
      :model-value="grouping"
      :aria-label="LIST_PRESENTATION_GROUPING_LABEL"
      :items="groupingItems"
      @update:model-value="handleGroupingUpdate"
    />

    <USelect
      v-if="props.config.sortingOptions.length > 1"
      :model-value="sorting"
      :aria-label="LIST_PRESENTATION_SORTING_LABEL"
      :items="sortingItems"
      @update:model-value="handleSortingUpdate"
    />
  </div>
</template>
