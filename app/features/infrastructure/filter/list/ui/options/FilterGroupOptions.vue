<script setup lang="ts">
  import type { FilterGroup, FilterItems } from '../../../types';

  import {
    FILTER_EXCLUDE_LABEL,
    FILTER_RANGE_LABEL,
    FILTER_SELECT_ALL_LABEL,
    FILTER_UNION_LABEL,
  } from '../../../model';
  import { getGroupItems } from '../../../utils';

  /**
   * Переключатели группы: «Диапазон», «Выбрать все», «Исключать» и «Точное
   * совпадение». Общие для дровера и встроенного списка — раскладка разная,
   * поведение одно.
   */
  const {
    items,
    size = 'xs',
    rangeAvailable = false,
  } = defineProps<{
    /** Показанные значения группы: «Выбрать все» работает именно по ним. */
    items: FilterItems;

    /** Можно ли выбирать значения группы ползунком: тогда есть «Диапазон». */
    rangeAvailable?: boolean;

    /** Размер переключателей: в панели раздела они крупнее, чем в дровере. */
    size?: 'xs' | 'md';
  }>();

  const group = defineModel<FilterGroup>({
    required: true,
  });

  /** Включён ли выбор ползунком вместо отдельных значений. */
  const range = defineModel<boolean>('range', {
    default: false,
  });

  /**
   * «Выбрать все» под ползунком лишний: пустой выбор и так означает «все», а
   * отметить всю шкалу можно, растянув ползунок от края до края.
   */
  const showSelectAll = computed(() => items.length > 0 && !range.value);

  const selectedCount = computed(
    () => items.filter((filterItem) => filterItem.selected).length,
  );

  /** Состояние переключателя «Выбрать все»: часть отмеченных даёт третье. */
  const selectAllState = computed<boolean | 'indeterminate'>(() => {
    if (selectedCount.value === 0) {
      return false;
    }

    return selectedCount.value === items.length ? true : 'indeterminate';
  });

  /** Переключает выбор значений между ползунком и отдельными тегами. */
  function handleRangeChange(enabled: boolean | 'indeterminate'): void {
    range.value = enabled === true;
  }

  /** Включает или выключает режим «Исключать» для группы. */
  function handleModeChange(mode: boolean | 'indeterminate'): void {
    group.value = { ...group.value, mode: mode === true };
  }

  /** Включает или выключает «Точное совпадение» для группы. */
  function handleUnionChange(union: boolean | 'indeterminate'): void {
    group.value = { ...group.value, union: union === true };
  }

  /**
   * Отмечает или снимает разом все показанные значения группы. Именно
   * показанные: под поиском и каскадом зависимостей в группе остаётся часть
   * значений, и переключатель обязан работать по тому, что видно.
   */
  function handleSelectAll(state: boolean | 'indeterminate'): void {
    const selected = state === true ? true : null;
    const visibleIds = new Set(items.map((filterItem) => filterItem.id));

    const values = getGroupItems(group.value).map((filterItem) =>
      visibleIds.has(filterItem.id) ? { ...filterItem, selected } : filterItem,
    );

    group.value = { ...group.value, values };
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <UCheckbox
      v-if="rangeAvailable"
      :model-value="range"
      :label="FILTER_RANGE_LABEL"
      :size
      @update:model-value="handleRangeChange"
    />

    <UCheckbox
      v-if="showSelectAll"
      :model-value="selectAllState"
      :label="FILTER_SELECT_ALL_LABEL"
      :size
      @update:model-value="handleSelectAll"
    />

    <UCheckbox
      v-if="group.supports?.mode"
      :model-value="group.mode"
      :label="FILTER_EXCLUDE_LABEL"
      :size
      color="error"
      @update:model-value="handleModeChange"
    />

    <UCheckbox
      v-if="group.supports?.union"
      :model-value="group.union"
      :label="FILTER_UNION_LABEL"
      :size
      @update:model-value="handleUnionChange"
    />
  </div>
</template>
