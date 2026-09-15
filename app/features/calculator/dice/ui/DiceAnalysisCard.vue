<script setup lang="ts">
  import { useDiceCalculator } from '../composables';
  import {
    chanceAtLeast,
    CHECK_FAILURE_LABELS,
    CHECK_SUCCESS_LABELS,
    createAnalysisNote,
    createHistogram,
    CRITICAL_OUTCOME_LABEL,
    DICE_ANALYSIS_LABELS,
    EMPTY_VALUE_PLACEHOLDER,
    formatProbability,
    formatRollNumber,
  } from '../model';
  import DiceDistributionChart from './DiceDistributionChart.vue';

  const { analysis, chanceThreshold, isAnalysisOpen, result } =
    useDiceCalculator();

  const histogram = computed(() =>
    analysis.value ? createHistogram(analysis.value.result) : null,
  );

  const meanLabel = computed(() =>
    analysis.value?.result.outcomeChances
      ? DICE_ANALYSIS_LABELS.meanWithChecks
      : DICE_ANALYSIS_LABELS.mean,
  );

  const stats = computed(() => {
    const current = analysis.value?.result;

    if (!current) {
      return [];
    }

    return [
      {
        key: 'mean',
        label: meanLabel.value,
        value: formatRollNumber(current.mean),
      },
      {
        key: 'min',
        label: DICE_ANALYSIS_LABELS.min,
        value: formatRollNumber(current.min),
      },
      {
        key: 'max',
        label: DICE_ANALYSIS_LABELS.max,
        value: formatRollNumber(current.max),
      },
    ];
  });

  // Цвет числа в чипе и цвет точки в легенде — один и тот же, иначе
  // «Попадание» в чипе и «Попадание» под графиком выглядели бы разными вещами.
  const outcomes = computed(() => {
    const current = analysis.value;
    const chances = current?.result.outcomeChances;
    const kind = current?.checkKind;

    if (!chances || !kind) {
      return [];
    }

    const rows = [
      {
        key: 'hit',
        label: CHECK_SUCCESS_LABELS[kind],
        value: formatProbability(chances.hit),
        text: 'text-primary',
        dot: 'bg-primary',
      },
    ];

    if (chances.critical > 0) {
      rows.push({
        key: 'critical',
        label: CRITICAL_OUTCOME_LABEL,
        value: formatProbability(chances.critical),
        text: 'text-success',
        dot: 'bg-success',
      });
    }

    rows.push({
      key: 'miss',
      label: CHECK_FAILURE_LABELS[kind],
      value: formatProbability(chances.miss),
      text: 'text-error',
      dot: 'bg-error',
    });

    return rows;
  });

  const note = computed(() => {
    const current = analysis.value;

    if (!current) {
      return '';
    }

    return createAnalysisNote(current.result, current.label);
  });

  const chanceLabel = computed(() => {
    const current = analysis.value;
    const threshold = chanceThreshold.value;

    if (!current || threshold === null || !Number.isFinite(threshold)) {
      return EMPTY_VALUE_PLACEHOLDER;
    }

    return formatProbability(
      chanceAtLeast(current.result.distribution, threshold),
    );
  });

  // Подсветка на гистограмме имеет смысл, только пока показанный бросок
  // относится к той же формуле и режиму, что и открытый анализ.
  const rolledValue = computed(() => {
    if (!result.value || !analysis.value) {
      return null;
    }

    return result.value.label === analysis.value.label
      ? result.value.value
      : null;
  });
</script>

<template>
  <section
    v-if="isAnalysisOpen && analysis && histogram"
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    :aria-label="DICE_ANALYSIS_LABELS.section"
  >
    <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:chart-bar"
        class="size-4 text-primary"
      />

      {{ DICE_ANALYSIS_LABELS.title }}
    </h3>

    <div
      v-if="outcomes.length"
      class="flex flex-wrap gap-2"
    >
      <span
        v-for="outcome in outcomes"
        :key="outcome.key"
        class="rounded-full px-3 py-1 text-sm text-muted ring ring-accented"
      >
        {{ outcome.label }}

        <b
          class="tabular-nums"
          :class="outcome.text"
        >
          {{ outcome.value }}
        </b>
      </span>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="rounded-md bg-elevated px-3 py-2.5 text-center ring ring-default"
      >
        <div class="text-xl font-bold text-highlighted tabular-nums">
          {{ stat.value }}
        </div>

        <div class="text-xs text-muted">{{ stat.label }}</div>
      </div>
    </div>

    <DiceDistributionChart
      :histogram="histogram"
      :distribution="analysis.result.distribution"
      :rolled-value="rolledValue"
    />

    <div
      v-if="outcomes.length"
      class="flex flex-wrap gap-4 text-xs text-muted"
    >
      <span
        v-for="outcome in outcomes"
        :key="outcome.key"
        class="flex items-center gap-1.5"
      >
        <span
          class="inline-block size-2.5 rounded-xs"
          :class="outcome.dot"
          aria-hidden="true"
        />

        {{ outcome.label }}
      </span>
    </div>

    <div
      class="flex flex-wrap items-center gap-2.5 border-t border-default pt-3 text-sm"
    >
      <span>{{ DICE_ANALYSIS_LABELS.chancePrefix }}</span>

      <UInputNumber
        v-model="chanceThreshold"
        class="w-28"
        :ui="{ base: 'text-center' }"
        :aria-label="DICE_ANALYSIS_LABELS.threshold"
      />

      <span>{{ DICE_ANALYSIS_LABELS.chanceSuffix }}</span>

      <b class="font-bold text-primary tabular-nums">{{ chanceLabel }}</b>
    </div>

    <p class="text-xs text-muted">{{ note }}</p>
  </section>
</template>
