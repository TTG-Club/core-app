<script setup lang="ts">
  import type { EncounterBudget } from '../model';

  import {
    DIFFICULTY_LABEL,
    formatExperience,
    getBudgetSegments,
    getBudgetSpentLabel,
    SEGMENT_CLASSES,
  } from '../model';

  const { totalExperience, budget } = defineProps<{
    totalExperience: number;
    budget: EncounterBudget;
  }>();

  const segments = computed(() =>
    getBudgetSegments(totalExperience, budget).map((segment) => ({
      ...segment,
      label: DIFFICULTY_LABEL[segment.difficulty],
      thresholdText: formatExperience(budget[segment.difficulty]),
      trackClass: SEGMENT_CLASSES[segment.difficulty].track,
      fillClass: SEGMENT_CLASSES[segment.difficulty].fill,
      widthStyle: { width: `${segment.width * 100}%` },
      fillStyle: { width: `${segment.fill * 100}%` },
    })),
  );

  const isOverBudget = computed(
    () => budget.high > 0 && totalExperience > budget.high,
  );

  const spentLabel = computed(() =>
    getBudgetSpentLabel(totalExperience, budget),
  );
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="flex h-4 w-full gap-0.5 overflow-hidden rounded-full"
      role="progressbar"
      :aria-valuenow="totalExperience"
      :aria-valuemin="0"
      :aria-valuemax="budget.high"
      :aria-valuetext="spentLabel"
    >
      <div
        v-for="segment in segments"
        :key="segment.difficulty"
        class="h-full overflow-hidden"
        :class="segment.trackClass"
        :style="segment.widthStyle"
      >
        <div
          class="h-full transition-[width] duration-300"
          :class="segment.fillClass"
          :style="segment.fillStyle"
        />
      </div>

      <UIcon
        v-if="isOverBudget"
        name="tabler:chevrons-right"
        class="size-4 shrink-0 text-error"
      />
    </div>

    <div class="flex w-full gap-0.5 text-xs">
      <div
        v-for="segment in segments"
        :key="segment.difficulty"
        class="flex min-w-0 flex-col items-end text-right"
        :style="segment.widthStyle"
      >
        <span class="truncate text-muted">{{ segment.label }}</span>

        <span class="font-medium text-highlighted tabular-nums">
          {{ segment.thresholdText }}
        </span>
      </div>
    </div>
  </div>
</template>
