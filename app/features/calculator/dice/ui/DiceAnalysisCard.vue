<script setup lang="ts">
  import { useDiceCalculator } from '../composables';
  import {
    chanceAtLeast,
    CHECK_FAILURE_LABELS,
    CHECK_SUCCESS_LABELS,
    createHistogram,
    formatProbability,
    formatRollNumber,
    MONTE_CARLO_SAMPLES,
  } from '../model';
  import DiceDistributionChart from './DiceDistributionChart.vue';

  const { analysis, chanceThreshold, isAnalysisOpen, result } =
    useDiceCalculator();

  const samplesLabel = MONTE_CARLO_SAMPLES.toLocaleString('ru-RU');

  const histogram = computed(() =>
    analysis.value ? createHistogram(analysis.value.result) : null,
  );

  const checkKind = computed(() => analysis.value?.checkKind ?? null);

  const successLabel = computed(() =>
    checkKind.value ? CHECK_SUCCESS_LABELS[checkKind.value] : '',
  );

  const failureLabel = computed(() =>
    checkKind.value ? CHECK_FAILURE_LABELS[checkKind.value] : '',
  );

  const meanLabel = computed(() =>
    analysis.value?.result.outcomeChances ? 'Средний результат' : 'В среднем',
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
      { key: 'min', label: 'Минимум', value: formatRollNumber(current.min) },
      { key: 'max', label: 'Максимум', value: formatRollNumber(current.max) },
    ];
  });

  const outcomes = computed(() => {
    const chances = analysis.value?.result.outcomeChances;

    if (!chances) {
      return [];
    }

    const rows = [
      {
        key: 'hit',
        label: successLabel.value,
        value: formatProbability(chances.hit),
        color: 'text-success',
        dot: 'bg-primary',
      },
    ];

    if (chances.critical > 0) {
      rows.push({
        key: 'critical',
        label: 'Крит',
        value: formatProbability(chances.critical),
        color: 'text-success',
        dot: 'bg-success',
      });
    }

    rows.push({
      key: 'miss',
      label: failureLabel.value,
      value: formatProbability(chances.miss),
      color: 'text-error',
      dot: 'bg-error',
    });

    return rows;
  });

  const note = computed(() => {
    const current = analysis.value;

    if (!current) {
      return '';
    }

    if (current.result.outcomeChances) {
      return `Оценка по ${samplesLabel} виртуальных бросков с учётом попаданий, критов и промахов.`;
    }

    return current.result.exact
      ? `Точный расчёт вероятностей: ${current.label}.`
      : `Оценка по ${samplesLabel} виртуальных бросков — формула слишком сложна для точного расчёта.`;
  });

  const chanceLabel = computed(() => {
    const current = analysis.value;
    const threshold = chanceThreshold.value;

    if (!current || threshold === null || !Number.isFinite(threshold)) {
      return '—';
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
    aria-label="Анализ вероятностей"
  >
    <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:chart-bar"
        class="size-4 text-primary"
      />

      Распределение результатов
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
          :class="outcome.color"
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
      <span>Шанс выбросить</span>

      <UInputNumber
        v-model="chanceThreshold"
        class="w-28"
        :ui="{ base: 'text-center' }"
        aria-label="Порог значения"
      />

      <span>или больше:</span>

      <b class="font-bold text-primary tabular-nums">{{ chanceLabel }}</b>
    </div>

    <p class="text-xs text-muted">{{ note }}</p>
  </section>
</template>
