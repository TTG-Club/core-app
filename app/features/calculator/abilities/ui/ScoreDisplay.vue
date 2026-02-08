<script setup lang="ts">
  import { ABILITY_SHORT_LABELS } from '../model/consts';

  import type { AbilityKey } from '~/shared/types';

  interface DisplayItem {
    key: AbilityKey;
    label: string;
    value: number;
    modifier: number;
    formattedModifier: string;
    breakdown: string | undefined;
  }

  defineProps<{
    items: DisplayItem[];
  }>();

  function isOvercap(value: number): boolean {
    return value > 20;
  }

  function getCardClass(value: number): string {
    const baseClass =
      'rounded-xl p-2 text-center border transition-colors hover:border-primary border-default';

    if (!isOvercap(value)) {
      return `${baseClass} bg-card`;
    }

    return `${baseClass} border-error bg-error/10`;
  }
</script>

<template>
  <div class="rounded-xl border border-default bg-muted p-4">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
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

    <div class="mt-4 text-xs text-secondary">
      Наведите на характеристику, чтобы увидеть детальный расчет.
    </div>
  </div>
</template>
