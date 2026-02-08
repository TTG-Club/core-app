<script setup lang="ts">
  import { useAbilitiesCalculator } from './composables/useAbilitiesCalculator';
  import { DEFAULT_SCORES, ZERO_SCORES } from './model';
  import {
    BonusBackgrounds,
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
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Left Column: Calculator Tabs -->
      <div class="flex flex-col gap-4 lg:col-span-2">
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
      </div>

      <!-- Right Column: Bonuses -->
      <div class="flex flex-col gap-4">
        <BonusBackgrounds @update:sources="backgroundBonuses = $event" />

        <div
          class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Уровень персонажа</span>

            <span class="text-sm font-bold text-primary">{{
              characterLevel
            }}</span>
          </div>

          <USlider
            v-model="characterLevel"
            :min="1"
            :max="20"
          />
        </div>

        <BonusFeats
          :level="characterLevel"
          @update:sources="featBonuses = $event"
        />
      </div>
    </div>
  </div>
</template>
