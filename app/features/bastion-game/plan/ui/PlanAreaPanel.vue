<script setup lang="ts">
  import type { PlanArea } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { PLAN_FEET_PER_CELL, PLAN_LABELS } from '../../model';

  /**
   * Выделенный участок: размер и кнопка, которая убирает всё на нём.
   */
  const { area, canEdit } = defineProps<{
    area: PlanArea;
    canEdit: boolean;
  }>();

  const emit = defineEmits<{
    clear: [];
  }>();

  const sizeText = computed(() =>
    fillTemplate(PLAN_LABELS.rectangleSize, {
      width: (Math.abs(area.to.x - area.from.x) + 1) * PLAN_FEET_PER_CELL,
      height: (Math.abs(area.to.y - area.from.y) + 1) * PLAN_FEET_PER_CELL,
    }),
  );
</script>

<template>
  <section class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between gap-2">
      <h3 class="text-sm font-semibold text-highlighted">
        {{ PLAN_LABELS.selectedArea }}
      </h3>

      <span class="text-xs text-muted tabular-nums">{{ sizeText }}</span>
    </div>

    <template v-if="canEdit">
      <p class="text-xs text-muted">
        {{ PLAN_LABELS.clearAreaHint }}
      </p>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="subtle"
        block
        @click.left.exact.prevent="emit('clear')"
      >
        {{ PLAN_LABELS.clearArea }}
      </UButton>
    </template>
  </section>
</template>
