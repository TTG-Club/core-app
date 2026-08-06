<script setup lang="ts">
  import type { ListViewModeButton } from '../model';

  import { useListViewMode } from '../composable';
  import { LIST_VIEW_MODE_OPTIONS } from '../model';

  const { block = false } = defineProps<{
    block?: boolean;
  }>();

  const { viewMode } = useListViewMode();

  // Активный режим подсвечивается заливкой, неактивный остаётся нейтральным —
  // так пара кнопок читается как переключатель, а не как два независимых действия.
  const viewModeButtons = computed<Array<ListViewModeButton>>(() =>
    LIST_VIEW_MODE_OPTIONS.map((option) => {
      const isActive = option.value === viewMode.value;

      return {
        ...option,
        isActive,
        color: isActive ? 'primary' : 'neutral',
        variant: isActive ? 'solid' : 'subtle',
      };
    }),
  );
</script>

<template>
  <UFieldGroup>
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
