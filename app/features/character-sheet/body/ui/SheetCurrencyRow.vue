<script setup lang="ts">
  import type { CharacterCurrency } from '../../model';

  import { CURRENCY_LABELS, CURRENCY_ORDER } from '../../model';

  const props = defineProps<{
    currency: CharacterCurrency;
  }>();

  const currencyCells = computed(() =>
    CURRENCY_ORDER.map((key) => ({
      key,
      label: CURRENCY_LABELS[key],
      value: props.currency[key],
    })),
  );
</script>

<template>
  <div
    class="flex items-center justify-between gap-2 rounded-lg border border-default/50 bg-elevated/20 px-4 py-2"
  >
    <div
      v-for="cell in currencyCells"
      :key="cell.key"
      class="flex items-baseline gap-1.5"
    >
      <span class="text-sm font-bold text-highlighted">{{ cell.value }}</span>

      <span class="text-[10px] font-bold text-muted uppercase">
        {{ cell.label }}
      </span>
    </div>
  </div>
</template>
