<script setup lang="ts">
  import type { CharacterCurrency, CharacterCustomCurrency } from '../../model';

  import {
    CURRENCY_LABELS,
    CURRENCY_NAMES,
    CURRENCY_ORDER,
    SHEET_CURRENCY_ROW_ARIA_LABEL,
  } from '../../model';

  const props = defineProps<{
    currency: CharacterCurrency;
    customCurrencies: CharacterCustomCurrency[];
  }>();

  const emit = defineEmits<{
    edit: [];
  }>();

  // Ряд валют: пять стандартных монет (с расшифровкой) и пользовательские
  // валюты. Подпись в ряду — сокращение, полное название уходит в тултип
  // (для своей валюты без названия тултип показывает само сокращение).
  const currencyCells = computed(() => [
    ...CURRENCY_ORDER.map((key) => ({
      id: key,
      value: props.currency[key],
      label: CURRENCY_LABELS[key],
      name: CURRENCY_NAMES[key],
    })),
    ...props.customCurrencies.map((customCurrency) => ({
      id: `custom:${customCurrency.id}`,
      value: customCurrency.amount,
      label: customCurrency.label,
      name: customCurrency.name || customCurrency.label,
    })),
  ]);
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="SHEET_CURRENCY_ROW_ARIA_LABEL"
    class="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-lg border border-default/50 bg-elevated/20 px-4 py-2 transition-colors hover:border-default hover:bg-elevated/40"
    @click.left.exact.prevent="emit('edit')"
    @keydown.enter.prevent="emit('edit')"
    @keydown.space.prevent="emit('edit')"
  >
    <UTooltip
      v-for="cell in currencyCells"
      :key="cell.id"
      :text="cell.name"
    >
      <span class="flex items-baseline gap-1.5">
        <span class="text-sm font-bold text-highlighted">{{ cell.value }}</span>

        <span class="text-[10px] font-bold text-muted uppercase">
          {{ cell.label }}
        </span>
      </span>
    </UTooltip>
  </div>
</template>
