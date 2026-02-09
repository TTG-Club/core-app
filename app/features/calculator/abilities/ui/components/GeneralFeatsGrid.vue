<script setup lang="ts">
  import FeatSlot from './FeatSlot.vue';

  import type { AbilityKey } from '~/shared/types';

  import type {
    CalculatorAbilityOption,
    CalculatorFeatOption,
  } from '../../model';

  const props = defineProps<{
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

  function getPlaceholder(featLevel: number): string {
    return props.classAsiLevels.includes(featLevel)
      ? 'Выберите черту'
      : 'Недоступно';
  }

  function isSlotDisabled(featLevel: number): boolean {
    const isClassLevelAvailable = props.classAsiLevels.includes(featLevel);
    const hasFeatSelected = props.selectedFeats.get(featLevel);
    const isLevelReached = props.level >= featLevel;

    return !isClassLevelAvailable || (!isLevelReached && !hasFeatSelected);
  }

  function handleFeatUpdate(featLevel: number, value: string | undefined) {
    emit('update:selected-feat', featLevel, value);
  }

  function handleAbilityChoiceUpdate(
    featLevel: number,
    value: AbilityKey | undefined,
  ) {
    emit('update:ability-choice', featLevel, value);
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <FeatSlot
      v-for="featLevel in allAsiLevels"
      :key="featLevel"
      :model-value="selectedFeats.get(featLevel)"
      :ability-choice="featAbilityChoices.get(featLevel)"
      :options="getOptionsForLevel(featLevel)"
      :ability-options="getAbilityOptions(selectedFeats.get(featLevel))"
      :loading="loading"
      :label="`Уровень ${featLevel}`"
      :placeholder="getPlaceholder(featLevel)"
      :disabled="isSlotDisabled(featLevel)"
      :has-multiple-abilities="
        isFeatHasMultipleAbilities(selectedFeats.get(featLevel))
      "
      show-ability-choice
      @update:model-value="handleFeatUpdate(featLevel, $event)"
      @update:ability-choice="handleAbilityChoiceUpdate(featLevel, $event)"
    />
  </div>
</template>
