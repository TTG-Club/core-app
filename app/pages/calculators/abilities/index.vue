<script setup lang="ts">
  import { CalculatorsAbilities } from '~calculators/abilities';

  import type { BaseAbilityScores } from '~/shared/types';

  const scores = ref<BaseAbilityScores>({
    STRENGTH: 10,
    DEXTERITY: 10,
    CONSTITUTION: 10,
    INTELLIGENCE: 10,
    WISDOM: 10,
    CHARISMA: 10,
  });

  function areScoresEqual(a: BaseAbilityScores, b: BaseAbilityScores): boolean {
    return (
      a.STRENGTH === b.STRENGTH &&
      a.DEXTERITY === b.DEXTERITY &&
      a.CONSTITUTION === b.CONSTITUTION &&
      a.INTELLIGENCE === b.INTELLIGENCE &&
      a.WISDOM === b.WISDOM &&
      a.CHARISMA === b.CHARISMA
    );
  }

  function handleScoresUpdate(next: BaseAbilityScores): void {
    // Diagnostic log: helps see infinite update spam
    // eslint-disable-next-line no-console
    console.debug('[AbilityCalculator] update:modelValue', next);

    if (areScoresEqual(scores.value, next)) {
      // Guard: prevents infinite loops when component keeps emitting the same value
      return;
    }

    scores.value = next;
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Калькулятор характеристик"
  >
    <CalculatorsAbilities
      :model-value="scores"
      @update:model-value="handleScoresUpdate"
    />
  </NuxtLayout>
</template>
