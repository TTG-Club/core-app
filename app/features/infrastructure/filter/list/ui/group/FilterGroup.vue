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
    hasTouchedItem,
    selectRangeItems,
  } from '../../../utils';
  import { FilterTag } from '../tag';
  import {
    FILTER_RANGE_LABELS,
    FILTER_RANGE_MINIMUM,
    FILTER_RANGE_STEP,
  } from './constants';

  type GroupPosition = 'standalone' | 'top' | 'bottom';

  const {
    items,
    preview = false,
    position = 'standalone',
  } = defineProps<{
    items: FilterItems;
    preview?: boolean;
    position?: GroupPosition;
  }>();

  const group = defineModel<FilterGroupType>({
    required: true,
  });

  const isVisible = computed(() => !preview || hasTouchedItem(items));

  const rangeMode = ref(false);

  const rangeItems = computed(() =>
    getRangeItems(items, group.value.rangeOrder),
  );

  const standaloneItems = computed(() => {
    const rangeIds = new Set(
      rangeItems.value.map((filterItem) => filterItem.id),
    );

    return items.filter((filterItem) => !rangeIds.has(filterItem.id));
  });

  const supportsRange = computed(() => rangeItems.value.length > 0);
  const showRange = computed(() => rangeMode.value && supportsRange.value);
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

  const rangeHint = computed(() => {
    if (!selectedCount.value) {
      return FILTER_RANGE_LABELS.empty;
    }

    const [minimum, maximum] = rangeBounds.value;

    return selectedCount.value === maximum - minimum + 1
      ? undefined
      : FILTER_RANGE_LABELS.sparse;
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

    updateGroup({
      values: selectRangeItems(
        getGroupItems(group.value),
        rangeItems.value,
        parsed.data,
      ),
    });
  }

  /** Снимает выбор диапазона, сохраняя режим отображения и исключения. */
  function resetRange(): void {
    const rangeIds = new Set(
      rangeItems.value.map((filterItem) => filterItem.id),
    );

    updateGroup({
      values: getGroupItems(group.value).map((filterItem) =>
        rangeIds.has(filterItem.id)
          ? { ...filterItem, selected: null }
          : filterItem,
      ),
    });
  }

  const contentGapClass = computed(() => (preview ? 'gap-2' : undefined));

  // Классы бордера шапки: нижний блок не имеет скругления сверху
  const headerClass = computed(() => ({
    'rounded-t-xl': position !== 'bottom',
    'border border-default flex flex-wrap items-center justify-between gap-3 px-3 py-2': true,
  }));

  // Классы бордера тела: верхний блок не имеет скругления и нижней границы снизу
  const bodyClass = computed(() => ({
    'rounded-b-xl border-b': position !== 'top',
    'border-x border-default flex flex-wrap gap-3 px-3 py-4': true,
  }));

  // Группа приходит одним пропом (defineModel), но мутировать её (или проп
  // items) напрямую нельзя. Любое изменение пересобирается иммутабельно и
  // эмитится наверх через defineModel — родитель обновляет filter.value.
  function updateGroup(patch: Partial<FilterGroupType>): void {
    group.value = { ...group.value, ...patch };
  }

  function handleModeChange(mode: boolean | 'indeterminate'): void {
    updateGroup({ mode: mode === true });
  }

  function handleUnionChange(union: boolean | 'indeterminate'): void {
    updateGroup({ union: union === true });
  }

  function handleItemSelect(
    itemId: FilterItem['id'],
    selected: boolean | null,
  ): void {
    const values = getGroupItems(group.value).map((filterItem) =>
      filterItem.id === itemId ? { ...filterItem, selected } : filterItem,
    );

    updateGroup({ values });
  }
</script>

<template>
  <template v-if="isVisible">
    <div
      class="flex flex-col"
      :class="contentGapClass"
    >
      <span v-if="preview">{{ group.name }}:</span>

      <div
        v-else
        :class="headerClass"
      >
        <span class="font-medium">{{ group.name }}</span>

        <div class="flex flex-wrap items-center gap-3">
          <USwitch
            v-if="supportsRange"
            v-model="rangeMode"
            :label="FILTER_RANGE_LABELS.toggle"
            size="xs"
          />

          <UCheckbox
            v-if="group.supports?.mode"
            :model-value="group.mode"
            label="Исключать"
            size="xs"
            color="error"
            @update:model-value="handleModeChange"
          />

          <UCheckbox
            v-if="group.supports?.union"
            :model-value="group.union"
            label="Точное совпадение (AND)"
            size="xs"
            @update:model-value="handleUnionChange"
          />
        </div>
      </div>

      <div
        v-if="!preview"
        :class="bodyClass"
      >
        <div
          v-if="showRange"
          class="flex w-full min-w-0 flex-col gap-3"
        >
          <div class="flex items-center justify-between gap-3 text-sm">
            <span>{{ rangeMinimumLabel }} — {{ rangeMaximumLabel }}</span>

            <UButton
              :label="FILTER_RANGE_LABELS.reset"
              :disabled="!selectedCount"
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
            class="flex flex-wrap gap-3"
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

        <template v-else>
          <FilterTag
            v-for="filterItem in items"
            :key="`${filterItem.id}-${filterItem.name}`"
            :model-value="filterItem.selected"
            :exclude="group.mode"
            @update:model-value="handleItemSelect(filterItem.id, $event)"
          >
            {{ filterItem.name }}
          </FilterTag>
        </template>
      </div>

      <div
        v-else
        class="flex flex-wrap gap-2"
      >
        <FilterTag
          v-for="filterItem in items"
          :key="`${filterItem.id}-${filterItem.name}`"
          :model-value="filterItem.selected"
          preview
          :exclude="group.mode"
          @update:model-value="handleItemSelect(filterItem.id, $event)"
        >
          {{ filterItem.name }}
        </FilterTag>
      </div>
    </div>
  </template>
</template>
