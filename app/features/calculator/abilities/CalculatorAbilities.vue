<script setup lang="ts">
  import { useAbilitiesCalculator } from './composables/useAbilitiesCalculator';
  import { DEFAULT_SCORES, ZERO_SCORES } from './model';
  import {
    BonusFeats,
    PointBuyTab,
    RandomRollTab,
    ScoreDisplay,
    StandardArrayTab,
  } from './ui';

  import type { AbilityScores, BonusSource, RandomRollState } from './model';

  // --- State Management ---
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
  const characterLevel = ref(1);

  enum TabValues {
    Random = 'random',
    StandardArray = 'standard-array',
    PointBuy = 'point-buy',
  }

  // --- Tabs Configuration ---
  const tabs = [
    {
      label: 'Случайный набор',
      value: TabValues.Random,
      slot: TabValues.Random,
    },
    {
      label: 'Стандартный набор',
      value: TabValues.StandardArray,
      slot: TabValues.StandardArray,
    },
    {
      label: 'Покупка значений',
      value: TabValues.PointBuy,
      slot: TabValues.PointBuy,
    },
  ];

  const selectedTabIndex = ref(TabValues.Random);

  // --- Calculator Integration ---
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
  ]);

  const { formattedScores } = useAbilitiesCalculator(
    activeBaseScores,
    allBonuses,
  );
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Results Display -->
    <ScoreDisplay :items="formattedScores" />

    <!-- Main Content Area -->
    <div class="flex flex-col gap-6">
      <!-- Calculator Tabs -->
      <UTabs
        v-model="selectedTabIndex"
        :items="tabs"
        :ui="{ root: 'flex flex-col gap-4' }"
      >
        <template #random>
          <RandomRollTab v-model:state="randomRollState" />
        </template>

        <template #standard-array>
          <StandardArrayTab v-model="arrayScores" />
        </template>

        <template #point-buy>
          <PointBuyTab v-model="pointBuyScores" />
        </template>
      </UTabs>

      <BonusFeats
        v-model="characterLevel"
        @update:feat-sources="featBonuses = $event"
        @update:background-sources="backgroundBonuses = $event"
      />
    </div>
  </div>
</template>
