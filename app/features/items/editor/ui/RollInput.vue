<script setup lang="ts">
  import type { Roll } from '~items/model';

  import { ROLL_INPUT_LABELS } from '~items/model';
  import { SelectDice } from '~ui/select';

  const model = defineModel<Roll>({ required: true });

  const { dicePlaceholder = ROLL_INPUT_LABELS.dice, disabled = false } =
    defineProps<{
      dicePlaceholder?: string;
      /** Значение выводится из другого поля и правится только через него. */
      disabled?: boolean;
    }>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <UInputNumber
      v-model="model.diceCount"
      :placeholder="ROLL_INPUT_LABELS.diceCount"
      :min="0"
      :disabled
    />

    <SelectDice
      v-model="model.dice"
      :placeholder="dicePlaceholder"
      :disabled
    />

    <UInputNumber
      v-model="model.bonus"
      :placeholder="ROLL_INPUT_LABELS.bonus"
      :disabled
    />
  </div>
</template>
