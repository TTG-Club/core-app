<script setup lang="ts">
  import type {
    FilterGroup as FilterGroupType,
    FilterItem,
    FilterItems,
  } from '../../../types';

  import { getGroupItems, hasTouchedItem } from '../../../utils';
  import { FilterTag } from '../tag';

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
