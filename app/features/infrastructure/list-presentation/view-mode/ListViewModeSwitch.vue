<script setup lang="ts">
  import type { ListViewModeButton, ListViewModeState } from '../model';

  import { useListViewMode } from '../composable';
  import {
    LIST_VIEW_MODE_COLORS,
    LIST_VIEW_MODE_GROUP_LABEL,
    LIST_VIEW_MODE_OPTIONS,
    LIST_VIEW_MODE_VARIANTS,
  } from '../model';

  const { block = false } = defineProps<{
    /** Растягивает пару кнопок на всю ширину — для отдельного ряда на десктопе. */
    block?: boolean;
  }>();

  const { viewMode } = useListViewMode();

  const viewModeButtons = computed<Array<ListViewModeButton>>(() =>
    LIST_VIEW_MODE_OPTIONS.map((option) => {
      const isActive = option.value === viewMode.value;
      const state: ListViewModeState = isActive ? 'active' : 'inactive';

      return {
        ...option,
        isActive,
        color: LIST_VIEW_MODE_COLORS[state],
        variant: LIST_VIEW_MODE_VARIANTS[state],
      };
    }),
  );
</script>

<template>
  <UFieldGroup
    role="group"
    :aria-label="LIST_VIEW_MODE_GROUP_LABEL"
  >
    <UButton
      v-for="button in viewModeButtons"
      :key="button.value"
      :icon="button.icon"
      :title="button.label"
      :aria-label="button.label"
      :aria-pressed="button.isActive"
      :color="button.color"
      :variant="button.variant"
      :square="!block"
      :block
      @click.left.exact.prevent="viewMode = button.value"
    />
  </UFieldGroup>
</template>
