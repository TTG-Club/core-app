<script setup lang="ts">
  import type { BonusSource } from './model';

  import CalculatorAbilityScores from './CalculatorAbilityScores.vue';
  import { AbilityBonuses } from './ui';

  const featBonuses = ref<BonusSource[]>([]);
  const backgroundBonuses = ref<BonusSource[]>([]);
  const classBonuses = ref<BonusSource[]>([]);
  const characterLevel = ref(1);

  const selectedClassUrl = ref<string>();
  const classAbilityTemplate = ref<Array<number>>([]);

  const allBonuses = computed(() => [
    ...featBonuses.value,
    ...backgroundBonuses.value,
    ...classBonuses.value,
  ]);
</script>

<template>
  <div class="flex flex-col gap-6">
    <CalculatorAbilityScores
      :bonuses="allBonuses"
      :selected-class-url="selectedClassUrl"
      :class-ability-template="classAbilityTemplate"
    />

    <AbilityBonuses
      v-model="characterLevel"
      @update:feat-sources="featBonuses = $event"
      @update:background-sources="backgroundBonuses = $event"
      @update:class-sources="classBonuses = $event"
      @update:selected-class-url="selectedClassUrl = $event"
      @update:class-ability-template="classAbilityTemplate = $event"
    />
  </div>
</template>
