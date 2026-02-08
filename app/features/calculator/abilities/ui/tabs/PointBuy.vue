<script setup lang="ts">
  import { ABILITY_KEYS, ABILITY_LABELS } from '~/shared/types';
  import { AbilityKey } from '~/shared/types/abilities';

  import { POINT_BUY_COSTS } from '../../model/consts';

  import type { AbilityScores } from '../../model/types';

  const props = defineProps<{
    modelValue: AbilityScores;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: AbilityScores): void;
  }>();

  const BUDGET = 27;
  const MIN_SCORE = 8;
  const MAX_SCORE = 15;

  const localScores = ref<AbilityScores>({ ...props.modelValue });

  watch(
    () => props.modelValue,
    (newVal) => {
      localScores.value = { ...newVal };
    },
    { immediate: true, deep: true },
  );

  function getCost(score: number): number {
    return POINT_BUY_COSTS[score] ?? 0;
  }

  const totalCost = computed(() => {
    let cost = 0;

    for (const key of Object.values(AbilityKey)) {
      cost += getCost(localScores.value[key]);
    }

    return cost;
  });

  const remainingPoints = computed(() => BUDGET - totalCost.value);

  function canIncrease(key: AbilityKey): boolean {
    const current = localScores.value[key];

    if (current >= MAX_SCORE) {
      return false;
    }

    const nextCost = getCost(current + 1);
    const currentCost = getCost(current);
    const diff = nextCost - currentCost;

    return remainingPoints.value >= diff;
  }

  function canDecrease(key: AbilityKey): boolean {
    return localScores.value[key] > MIN_SCORE;
  }

  function updateScore(key: AbilityKey, delta: number) {
    const current = localScores.value[key];
    const next = current + delta;

    if (next < MIN_SCORE || next > MAX_SCORE) {
      return;
    }

    // Check budget on increase
    if (delta > 0 && !canIncrease(key)) {
      return;
    }

    const newScores = { ...localScores.value, [key]: next };

    localScores.value = newScores;
    emit('update:modelValue', newScores);
  }
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex items-center justify-between">
      <div class="text-sm text-secondary">
        Бюджет: {{ BUDGET }} очков. Диапазон: {{ MIN_SCORE }}–{{ MAX_SCORE }}.
      </div>

      <div
        class="text-sm font-semibold"
        :class="remainingPoints > 0 ? 'text-red-500' : undefined"
      >
        Осталось: {{ remainingPoints }}
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="key in ABILITY_KEYS"
        :key="key"
        class="bg-card flex items-center justify-between gap-3 rounded-xl border border-default p-3"
      >
        <div>
          <div class="font-semibold">{{ ABILITY_LABELS[key] }}</div>

          <div class="text-xs text-secondary">
            Стоимость: {{ getCost(localScores[key]) }}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            icon="i-fluent-subtract-24-regular"
            size="xs"
            color="neutral"
            variant="soft"
            :disabled="!canDecrease(key)"
            @click="updateScore(key, -1)"
          />

          <div class="w-8 text-center font-semibold">
            {{ localScores[key] }}
          </div>

          <UButton
            icon="i-fluent-add-24-regular"
            size="xs"
            color="neutral"
            variant="soft"
            :disabled="!canIncrease(key)"
            @click="updateScore(key, 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
