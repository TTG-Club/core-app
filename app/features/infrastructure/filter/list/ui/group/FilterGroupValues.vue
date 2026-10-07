<script setup lang="ts">
  import type {
    FilterGroup as FilterGroupType,
    FilterItem,
    FilterItems,
  } from '../../../types';

  import { z } from 'zod';

  import {
    getGroupItems,
    getRangeBounds,
    getRangeItems,
    selectRangeItems,
  } from '../../../utils';
  import { FilterTag } from '../tag';
  import {
    FILTER_RANGE_LABELS,
    FILTER_RANGE_MINIMUM,
    FILTER_RANGE_STEP,
  } from './constants';

  /**
   * Значения группы: теги или, в режиме диапазона, слайдер по упорядоченным
   * значениям и теги для тех, что в диапазон не входят.
   */
  const { items, range = false } = defineProps<{
    /** Показанные значения группы. */
    items: FilterItems;

    /** Включён ли выбор диапазоном (если группа его поддерживает). */
    range?: boolean;
  }>();

  const group = defineModel<FilterGroupType>({
    required: true,
  });

  const rangeItems = computed(() =>
    getRangeItems(items, group.value.rangeOrder),
  );

  const standaloneItems = computed(() => {
    const rangeIds = new Set(
      rangeItems.value.map((filterItem) => filterItem.id),
    );

    return items.filter((filterItem) => !rangeIds.has(filterItem.id));
  });

  const showRange = computed(() => range && rangeItems.value.length > 0);
  const rangeMaximum = computed(() => rangeItems.value.length - 1);
  const rangeBounds = computed(() => getRangeBounds(rangeItems.value));
  const rangeColor = computed(() => (group.value.mode ? 'error' : 'primary'));

  const rangeMinimumLabel = computed(
    () => rangeItems.value[rangeBounds.value[0]]?.name,
  );

  const rangeMaximumLabel = computed(
    () => rangeItems.value[rangeBounds.value[1]]?.name,
  );

  const selectedCount = computed(
    () => rangeItems.value.filter((filterItem) => filterItem.selected).length,
  );

  const hasRangeSelection = computed(() => selectedCount.value > 0);

  /**
   * Подсказка под ползунком: нужна, только когда внутри границ отмечено не
   * всё — тогда ползунок показывает больше, чем выбрано на самом деле.
   */
  const rangeHint = computed(() => {
    const [minimum, maximum] = rangeBounds.value;

    return hasRangeSelection.value
      && selectedCount.value !== maximum - minimum + 1
      ? FILTER_RANGE_LABELS.sparse
      : undefined;
  });

  /** Применяет валидные границы слайдера к существующим значениям фильтра. */
  function handleRangeChange(value: unknown): void {
    const boundary = z
      .number()
      .int()
      .min(FILTER_RANGE_MINIMUM)
      .max(rangeMaximum.value);

    const parsed = z.tuple([boundary, boundary]).safeParse(value);

    if (!parsed.success || parsed.data[0] > parsed.data[1]) {
      return;
    }

    group.value = {
      ...group.value,
      values: selectRangeItems(
        getGroupItems(group.value),
        rangeItems.value,
        parsed.data,
      ),
    };
  }

  /** Снимает выбор диапазона, сохраняя режим отображения и исключения. */
  function resetRange(): void {
    const rangeIds = new Set(
      rangeItems.value.map((filterItem) => filterItem.id),
    );

    group.value = {
      ...group.value,
      values: getGroupItems(group.value).map((filterItem) =>
        rangeIds.has(filterItem.id)
          ? { ...filterItem, selected: null }
          : filterItem,
      ),
    };
  }

  /**
   * Отмечает или снимает одно значение группы.
   *
   * Группа приходит одним пропом (defineModel), но мутировать её (или проп
   * items) напрямую нельзя. Любое изменение пересобирается иммутабельно и
   * эмитится наверх через defineModel — родитель обновляет filter.value.
   */
  function handleItemSelect(
    itemId: FilterItem['id'],
    selected: boolean | null,
  ): void {
    const values = getGroupItems(group.value).map((filterItem) =>
      filterItem.id === itemId ? { ...filterItem, selected } : filterItem,
    );

    group.value = { ...group.value, values };
  }
</script>

<template>
  <div
    v-if="showRange"
    class="flex w-full min-w-0 flex-col gap-3"
  >
    <div class="flex min-h-6 items-center justify-between gap-3 text-sm">
      <span v-if="hasRangeSelection">
        {{ rangeMinimumLabel }} — {{ rangeMaximumLabel }}
      </span>

      <span
        v-else
        class="text-muted"
      >
        {{ FILTER_RANGE_LABELS.empty }}
      </span>

      <UButton
        v-if="hasRangeSelection"
        :label="FILTER_RANGE_LABELS.reset"
        size="xs"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="resetRange"
      />
    </div>

    <USlider
      :model-value="rangeBounds"
      :min="FILTER_RANGE_MINIMUM"
      :max="rangeMaximum"
      :step="FILTER_RANGE_STEP"
      :min-steps-between-thumbs="FILTER_RANGE_MINIMUM"
      :color="rangeColor"
      :aria-label="group.name"
      @update:model-value="handleRangeChange"
    />

    <span
      v-if="rangeHint"
      class="text-xs text-muted"
      >{{ rangeHint }}</span
    >

    <div
      v-if="standaloneItems.length"
      class="flex flex-wrap gap-2"
    >
      <FilterTag
        v-for="filterItem in standaloneItems"
        :key="`${filterItem.id}-${filterItem.name}`"
        :model-value="filterItem.selected"
        :exclude="group.mode"
        @update:model-value="handleItemSelect(filterItem.id, $event)"
      >
        {{ filterItem.name }}
      </FilterTag>
    </div>
  </div>

  <div
    v-else
    class="flex flex-wrap gap-2"
  >
    <FilterTag
      v-for="filterItem in items"
      :key="`${filterItem.id}-${filterItem.name}`"
      :model-value="filterItem.selected"
      :exclude="group.mode"
      @update:model-value="handleItemSelect(filterItem.id, $event)"
    >
      {{ filterItem.name }}
    </FilterTag>
  </div>
</template>
