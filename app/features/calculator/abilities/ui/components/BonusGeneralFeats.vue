<script setup lang="ts">
  import BonusFeatSlot from './BonusFeatSlot.vue';

  import type { AbilityKey } from '~/shared/types';

  import type {
    CalculatorAbilityOption,
    CalculatorFeatOption,
  } from '../../model/types';

  defineProps<{
    allAsiLevels: number[];
    classAsiLevels: number[];
    level: number;
    selectedFeats: Map<number, string | undefined>;
    featAbilityChoices: Map<string | number, AbilityKey>;
    loading: boolean;
    getOptionsForLevel: (level: number) => CalculatorFeatOption[];
    getAbilityOptions: (url: string | undefined) => CalculatorAbilityOption[];
    isFeatHasMultipleAbilities: (url: string | undefined) => boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:selected-feat', level: number, value: string | undefined): void;
    (
      e: 'update:ability-choice',
      level: number,
      value: AbilityKey | undefined,
    ): void;
  }>();
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <template
      v-for="featLevel in allAsiLevels"
      :key="featLevel"
    >
      <BonusFeatSlot
        :model-value="selectedFeats.get(featLevel)"
        :ability-choice="featAbilityChoices.get(featLevel)"
        :options="getOptionsForLevel(featLevel)"
        :ability-options="getAbilityOptions(selectedFeats.get(featLevel))"
        :loading="loading"
        :label="`Уровень ${featLevel}`"
        :placeholder="
          classAsiLevels.includes(featLevel) ? 'Выберите черту' : 'Недоступно'
        "
        :disabled="
          !classAsiLevels.includes(featLevel) ||
          (level < featLevel && !selectedFeats.get(featLevel))
        "
        :has-multiple-abilities="
          isFeatHasMultipleAbilities(selectedFeats.get(featLevel))
        "
        show-ability-choice
        @update:model-value="
          (value) => emit('update:selected-feat', featLevel, value)
        "
        @update:ability-choice="
          (value) => emit('update:ability-choice', featLevel, value)
        "
      />
    </template>
  </div>
</template>
