<script setup lang="ts">
  import type { StartingEquipmentOption } from '../../model';

  import {
    getStartingEquipmentSummary,
    STARTING_EQUIPMENT_LABELS,
    STARTING_EQUIPMENT_SKIP_VALUE,
  } from '../../model';

  /** Вариант переключателя: метка варианта и перечисление его содержимого. */
  interface StartingEquipmentRadioItem {
    label: string;
    description: string;

    /** Метка варианта или `STARTING_EQUIPMENT_SKIP_VALUE`. */
    value: string;
  }

  const { options } = defineProps<{
    options: StartingEquipmentOption[];
  }>();

  /** Метка выбранного варианта; `STARTING_EQUIPMENT_SKIP_VALUE` — не добавлять. */
  const model = defineModel<string>({
    default: STARTING_EQUIPMENT_SKIP_VALUE,
  });

  const items = computed<StartingEquipmentRadioItem[]>(() => [
    ...options.map((option) => ({
      label: option.label,
      description: getStartingEquipmentSummary(option),
      value: option.label,
    })),
    {
      label: STARTING_EQUIPMENT_LABELS.skipLabel,
      description: STARTING_EQUIPMENT_LABELS.skipDescription,
      value: STARTING_EQUIPMENT_SKIP_VALUE,
    },
  ]);
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
      {{ STARTING_EQUIPMENT_LABELS.title }}
    </span>

    <URadioGroup
      v-model="model"
      :items="items"
      variant="list"
      color="primary"
    />

    <span class="text-xs text-muted">{{ STARTING_EQUIPMENT_LABELS.hint }}</span>
  </div>
</template>
