<script setup lang="ts">
  import type { PlanTool } from '../../model';

  import { PLAN_EDIT_TOOLS, PLAN_LABELS, PLAN_TOOL_GROUPS } from '../../model';

  /**
   * Инструменты редактора плана группами, отмена и повтор. В режиме
   * просмотра остаётся только «рука» для панорамы.
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

  const groups = computed(() =>
    PLAN_TOOL_GROUPS.map((group) =>
      group.filter((option) => canEdit || !PLAN_EDIT_TOOLS.has(option.tool)),
    ).filter((group) => group.length > 0),
  );

  /**
   * Оформление кнопки: выбранный инструмент подсвечен.
   *
   * @param option Инструмент.
   * @returns Цвет и вид кнопки.
   */
  function getButtonLook(option: { tool: PlanTool }): {
    color: 'primary' | 'neutral';
    variant: 'solid' | 'ghost';
  } {
    return tool.value === option.tool
      ? { color: 'primary', variant: 'solid' }
      : { color: 'neutral', variant: 'ghost' };
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <template
      v-for="(group, index) in groups"
      :key="index"
    >
      <USeparator
        v-if="index > 0"
        orientation="vertical"
        class="mx-1 h-6"
      />

      <UTooltip
        v-for="option in group"
        :key="option.tool"
        :text="option.label"
        :kbds="[option.key]"
      >
        <UButton
          :icon="option.icon"
          :aria-label="option.label"
          :aria-pressed="tool === option.tool"
          v-bind="getButtonLook(option)"
          size="sm"
          @click.left.exact.prevent="tool = option.tool"
        />
      </UTooltip>
    </template>

    <template v-if="canEdit">
      <USeparator
        orientation="vertical"
        class="mx-1 h-6"
      />

      <UTooltip
        :text="PLAN_LABELS.undo"
        :kbds="['meta', 'z']"
      >
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

      <UTooltip
        :text="PLAN_LABELS.redo"
        :kbds="['meta', 'shift', 'z']"
      >
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
