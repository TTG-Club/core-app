<script setup lang="ts">
  import { useAbilitiesCalculator } from './composables';
  import { ABILITIES_TABS, TabValues } from './consts';
  import { DEFAULT_SCORES, ZERO_SCORES } from './model';
  import {
    AbilityBonuses,
    PointBuyTab,
    RandomRollTab,
    ScoreDisplay,
    StandardArrayTab,
  } from './ui';

  import type { AbilityScores, BonusSource, RandomRollState } from './model';

  const pointBuyScores = ref<AbilityScores>({ ...DEFAULT_SCORES });
  const arrayScores = ref<AbilityScores>({ ...ZERO_SCORES });

  const randomRollState = ref<RandomRollState>({
    scores: { ...ZERO_SCORES },
    isComplete: false,
    rolls: [],
    assignments: {},
  });

  const featBonuses = ref<BonusSource[]>([]);
  const backgroundBonuses = ref<BonusSource[]>([]);
  const classBonuses = ref<BonusSource[]>([]);
  const characterLevel = ref(1);

  const selectedClassUrl = ref<string>();
  const classAbilityTemplate = ref<Array<number>>([]);

  const selectedTabIndex = ref(TabValues.Random);

  const activeBaseScores = computed(() => {
    switch (selectedTabIndex.value) {
      case TabValues.Random:
        return randomRollState.value.scores;
      case TabValues.StandardArray:
        return arrayScores.value;
      case TabValues.PointBuy:
        return pointBuyScores.value;
      default:
        return randomRollState.value.scores;
    }
  });

  const allBonuses = computed(() => [
    ...featBonuses.value,
    ...backgroundBonuses.value,
    ...classBonuses.value,
  ]);

  const { formattedScores } = useAbilitiesCalculator(
    activeBaseScores,
    allBonuses,
  );
</script>

<template>
  <div class="flex flex-col gap-6">
    <ScoreDisplay :items="formattedScores" />

    <div class="flex flex-col gap-6">
      <UTabs
        v-model="selectedTabIndex"
        :items="ABILITIES_TABS"
        :ui="{ root: 'flex flex-col gap-4' }"
      >
        <template #random>
          <RandomRollTab v-model:state="randomRollState" />
        </template>

        <template #standard-array>
          <StandardArrayTab
            v-model="arrayScores"
            :selected-class-url="selectedClassUrl"
            :class-ability-template="classAbilityTemplate"
          />
        </template>

        <template #point-buy>
          <PointBuyTab v-model="pointBuyScores" />
        </template>
      </UTabs>

      <AbilityBonuses
        v-model="characterLevel"
        @update:feat-sources="featBonuses = $event"
        @update:background-sources="backgroundBonuses = $event"
        @update:class-sources="classBonuses = $event"
        @update:selected-class-url="selectedClassUrl = $event"
        @update:class-ability-template="classAbilityTemplate = $event"
      />
    </div>
  </div>
</template>
