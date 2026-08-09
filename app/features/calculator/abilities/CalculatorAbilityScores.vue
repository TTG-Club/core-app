<script setup lang="ts">
  import type { AbilityScores, BonusSource, RandomRollState } from './model';

  import { useAbilitiesCalculator } from './composables';
  import {
    ABILITIES_TABS,
    DEFAULT_SCORES,
    TabValues,
    ZERO_SCORES,
  } from './model';
  import {
    PointBuyTab,
    RandomRollTab,
    ScoreDisplay,
    StandardArrayTab,
  } from './ui';

  /**
   * Наборы значений характеристик: случайный бросок, стандартный набор и покупка
   * очков вместе с итоговой сводкой. Своего состояния снаружи набор не требует —
   * результат уходит наверх моделью `scores`, поэтому им пользуется и страница
   * калькулятора, и лист персонажа.
   */
  const props = defineProps<{
    /**
     * Источники прибавок к базовым значениям (предыстория, черты, класс). Они
     * учитываются в сводке и в разборе значения, но не в самих наборах.
     */
    bonuses?: BonusSource[];

    /** URL выбранного класса — для шаблона стандартного набора. */
    selectedClassUrl?: string;

    /**
     * Шаблон распределения стандартного набора от класса. Не передан — кнопки
     * «Использовать шаблон класса» нет вовсе: без выбора класса рядом она была
     * бы вечно неактивной.
     */
    classAbilityTemplate?: number[];
  }>();

  // Базовые значения активного набора: итог считается уже над ними, поэтому
  // наружу уходит именно набор, а не сумма с прибавками — вызывающая сторона
  // сама решает, что делать с бонусами (лист хранит их внутри значения).
  const scores = defineModel<AbilityScores>('scores', {
    default: () => ({ ...ZERO_SCORES }),
  });

  const pointBuyScores = ref<AbilityScores>({ ...DEFAULT_SCORES });
  const arrayScores = ref<AbilityScores>({ ...ZERO_SCORES });

  const randomRollState = ref<RandomRollState>({
    scores: { ...ZERO_SCORES },
    isComplete: false,
    rolls: [],
    assignments: {},
  });

  const selectedTabIndex = ref(TabValues.Random);

  const activeBaseScores = computed(() => {
    switch (selectedTabIndex.value) {
      case TabValues.StandardArray:
        return arrayScores.value;
      case TabValues.PointBuy:
        return pointBuyScores.value;
      default:
        return randomRollState.value.scores;
    }
  });

  const bonusSources = computed(() => props.bonuses ?? []);

  const { formattedScores } = useAbilitiesCalculator(
    activeBaseScores,
    bonusSources,
  );

  // Модель только пишется: наборы — единственный источник значений, и обратной
  // подстановки нет, поэтому цикла «модель → набор → модель» не возникает.
  watch(activeBaseScores, (baseScores) => (scores.value = baseScores), {
    immediate: true,
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <ScoreDisplay :items="formattedScores" />

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
  </div>
</template>
