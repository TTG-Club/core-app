<script setup lang="ts">
  import type { Roll } from '~items/model';

  import { SelectDice } from '~ui/select';

  const model = defineModel<Roll>({ required: true });

  const { dicePlaceholder = 'Кость' } = defineProps<{
    dicePlaceholder?: string;
  }>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <UInputNumber
      v-model="model.diceCount"
      placeholder="Кол-во"
      :min="0"
    />

    <SelectDice
      v-model="model.dice"
      :placeholder="dicePlaceholder"
    />

    <UInputNumber
      v-model="model.bonus"
      placeholder="Бонус"
    />
  </div>
</template>
