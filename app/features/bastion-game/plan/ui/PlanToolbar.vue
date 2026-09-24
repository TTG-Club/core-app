<script setup lang="ts">
  import type { PlanTool } from '../../model';

  import { PLAN_EDIT_TOOLS, PLAN_LABELS, PLAN_TOOL_OPTIONS } from '../../model';

  /**
   * Инструменты редактора плана, отмена и повтор. В режиме просмотра остаётся
   * только «рука» для панорамы.
   */
  const { canEdit, canUndo, canRedo } = defineProps<{
    canEdit: boolean;
    canUndo: boolean;
    canRedo: boolean;
  }>();

  const tool = defineModel<PlanTool>('tool', { required: true });

  defineEmits<{
    undo: [];
    redo: [];
  }>();

  const tools = computed(() =>
    PLAN_TOOL_OPTIONS.filter(
      (option) => canEdit || !PLAN_EDIT_TOOLS.has(option.tool),
    ),
  );
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <UTooltip
      v-for="option in tools"
      :key="option.tool"
      :text="option.label"
    >
      <UButton
        :icon="option.icon"
        :aria-label="option.label"
        :color="tool === option.tool ? 'primary' : 'neutral'"
        :variant="tool === option.tool ? 'solid' : 'ghost'"
        size="sm"
        @click.left.exact.prevent="tool = option.tool"
      />
    </UTooltip>

    <template v-if="canEdit">
      <USeparator
        orientation="vertical"
        class="mx-1 h-6"
      />

      <UTooltip :text="PLAN_LABELS.undo">
        <UButton
          icon="tabler:arrow-back-up"
          :aria-label="PLAN_LABELS.undo"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canUndo"
          @click.left.exact.prevent="$emit('undo')"
        />
      </UTooltip>

      <UTooltip :text="PLAN_LABELS.redo">
        <UButton
          icon="tabler:arrow-forward-up"
          :aria-label="PLAN_LABELS.redo"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canRedo"
          @click.left.exact.prevent="$emit('redo')"
        />
      </UTooltip>
    </template>
  </div>
</template>
