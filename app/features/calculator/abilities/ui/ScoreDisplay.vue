<script setup lang="ts">
  import { ABILITY_SHORT_LABELS } from '~/shared/types';

  import { ABILITY_MAX_SCORE } from '../model';

  import type { AbilityKey } from '~/shared/types';

  interface DisplayItem {
    key: AbilityKey;
    label: string;
    value: number;
    modifier: number;
    formattedModifier: string;
    breakdown: string | undefined;
    baseValue: number;
  }

  const { items } = defineProps<{
    items: DisplayItem[];
  }>();

  function isOvercap(value: number): boolean {
    return value > ABILITY_MAX_SCORE;
  }

  function getCardClass(value: number): string {
    const baseClass =
      'rounded-xl p-2 text-center border transition-shadow hover:shadow-lg border-default';

    if (isOvercap(value)) {
      return `${baseClass} border-error bg-error/5`;
    }

    return `${baseClass} bg-card`;
  }

  const totalBase = computed(() =>
    items.reduce((sum, scoreItem) => sum + scoreItem.baseValue, 0),
  );

  const totalScore = computed(() =>
    items.reduce((sum, scoreItem) => sum + scoreItem.value, 0),
  );
</script>

<template>
  <div class="rounded-xl border border-default bg-muted p-4">
    <div
      class="grid grid-flow-col grid-cols-2 grid-rows-3 gap-2 sm:grid-flow-row sm:grid-cols-3 sm:grid-rows-2 md:grid-cols-6 md:grid-rows-1"
    >
      <UTooltip
        v-for="item in items"
        :key="item.key"
        :text="item.breakdown"
      >
        <div :class="getCardClass(item.value)">
          <div class="text-xs text-muted">
            {{ ABILITY_SHORT_LABELS[item.key] }}
          </div>

          <div class="text-lg font-semibold">
            {{ item.value }}
            <span class="text-sm text-muted">
              ({{ item.formattedModifier }})
            </span>
          </div>
        </div>
      </UTooltip>
    </div>

    <div
      class="mt-4 flex flex-col justify-between gap-2 text-xs text-secondary sm:flex-row sm:items-center"
    >
      <div>Наведите на характеристику, чтобы увидеть детальный расчет.</div>

      <div class="flex gap-1 font-medium">
        <div>
          Сумма очков: <span class="text-primary">{{ totalBase }}</span>
        </div>
        ·
        <div>
          Включая бонусы: <span class="text-primary">{{ totalScore }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
