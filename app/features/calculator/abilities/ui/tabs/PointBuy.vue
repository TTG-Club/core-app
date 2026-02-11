<script setup lang="ts">
  import { ABILITY_KEYS, ABILITY_LABELS } from '~/shared/types';
  import { AbilityKey } from '~/shared/types/abilities';

  import {
    POINT_BUY_BUDGET,
    POINT_BUY_COSTS,
    POINT_BUY_MAX_SCORE,
    POINT_BUY_MIN_SCORE,
    ZERO_SCORES,
  } from '../../model';

  import type { AbilityScores } from '../../model';

  const model = defineModel<AbilityScores>({ required: true });

  const localScores = ref<AbilityScores>({ ...ZERO_SCORES });

  const budget = ref(POINT_BUY_BUDGET);
  const minScore = ref(POINT_BUY_MIN_SCORE);
  const maxScore = ref(POINT_BUY_MAX_SCORE);
  const costs = ref<Record<number, number>>({ ...POINT_BUY_COSTS });

  watch(
    [minScore, maxScore],
    ([min, max]) => {
      for (let i = min; i <= max; i++) {
        if (costs.value[i] === undefined) {
          costs.value[i] = i - 8;
        }
      }
    },
    { immediate: true },
  );

  const costRange = computed(() => {
    const range: number[] = [];

    for (let i = 3; i <= 18; i++) {
      range.push(i);
    }

    return range;
  });

  watch(
    model,
    (newVal) => {
      localScores.value = { ...newVal };
    },
    { immediate: true, deep: true },
  );

  function getCost(score: number): number {
    return costs.value[score] ?? 0;
  }

  const totalCost = computed(() => {
    let cost = 0;

    for (const key of Object.values(AbilityKey)) {
      cost += getCost(localScores.value[key]);
    }

    return cost;
  });

  const remainingPoints = computed(() => budget.value - totalCost.value);

  function canIncrease(key: AbilityKey): boolean {
    const current = localScores.value[key];

    if (current >= maxScore.value) {
      return false;
    }

    const nextCost = getCost(current + 1);
    const currentCost = getCost(current);
    const diff = nextCost - currentCost;

    return remainingPoints.value >= diff;
  }

  function onUpdateScore(key: AbilityKey, value: number) {
    const current = localScores.value[key];

    if (value < minScore.value || value > maxScore.value) {
      return;
    }

    const newCost = getCost(value);
    const currentCost = getCost(current);
    const diff = newCost - currentCost;

    if (remainingPoints.value >= diff) {
      const newScores = { ...localScores.value, [key]: value };

      localScores.value = newScores;
      model.value = newScores;
    }
  }

  function handleScoreUpdate(key: AbilityKey, value: unknown) {
    if (typeof value === 'number') {
      onUpdateScore(key, value);
    }
  }

  const remainingPointsClass = computed(() =>
    remainingPoints.value !== 0 ? 'text-primary' : undefined,
  );
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
  >
    <UCollapsible class="flex flex-col gap-4">
      <div class="flex items-start justify-between gap-4">
        <div
          class="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-4"
        >
          <div class="font-semibold">Бюджет: {{ budget }}</div>

          <div
            class="font-semibold"
            :class="remainingPointsClass"
          >
            Осталось: {{ remainingPoints }}
          </div>

          <div class="text-xs text-secondary">
            Диапазон: {{ minScore }}–{{ maxScore }}
          </div>
        </div>

        <UButton
          icon="i-fluent-settings-24-regular"
          color="neutral"
          variant="subtle"
          size="sm"
        />
      </div>

      <template #content>
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UFormField
              label="Бюджет очков"
              help="Всего очков на распределение"
            >
              <UInputNumber v-model="budget" />
            </UFormField>

            <UFormField
              label="Минимум"
              help="Мин. значение"
            >
              <UInputNumber
                v-model="minScore"
                :min="3"
                :max="maxScore"
              />
            </UFormField>

            <UFormField
              label="Максимум"
              help="Макс. значение"
            >
              <UInputNumber
                v-model="maxScore"
                :min="minScore"
                :max="18"
              />
            </UFormField>
          </div>

          <div class="flex flex-col gap-2">
            <div class="text-sm font-medium">
              Стоимость значений
              <span class="block text-xs font-normal text-secondary">
                Стоимость в очках
              </span>
            </div>

            <div
              class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
            >
              <UFieldGroup
                v-for="score in costRange"
                :key="score"
                size="sm"
                class="flex"
              >
                <UBadge
                  :label="String(score)"
                  color="neutral"
                  variant="subtle"
                  class="w-8 justify-center"
                />

                <UInputNumber
                  v-model="costs[score]"
                  class="min-w-0 flex-1 text-center"
                  placeholder="0"
                  :disabled="score < minScore || score > maxScore"
                />
              </UFieldGroup>
            </div>
          </div>
        </div>
      </template>
    </UCollapsible>

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

        <UInputNumber
          :model-value="localScores[key]"
          :min="minScore"
          :max="canIncrease(key) ? maxScore : localScores[key]"
          class="w-32"
          @update:model-value="handleScoreUpdate(key, $event)"
        />
      </div>
    </div>
  </div>
</template>
