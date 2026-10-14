<script setup lang="ts">
  import type {
    BugReportDiagnostics,
    BugReportDiagnosticsTimelineSample,
  } from '../../model';

  import {
    BUG_REPORT_DIAGNOSTICS_CPU_WARN_PERCENT,
    BUG_REPORT_DIAGNOSTICS_ELECTRON_LABEL,
    BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE,
    BUG_REPORT_DIAGNOSTICS_GC_WARN_MS,
    BUG_REPORT_DIAGNOSTICS_MB_UNIT,
    BUG_REPORT_DIAGNOSTICS_MS_UNIT,
    BUG_REPORT_DIAGNOSTICS_NODE_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_CPU_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_CPU_MODEL_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_GC_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_HEADLESS_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_HOST_TITLE,
    BUG_REPORT_DIAGNOSTICS_SERVER_OS_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_RAM_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_RUNTIME_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_UPTIME_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_AGO_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_AGO_SUFFIX,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_EVENT_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_GC_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_LAG_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_PROCESS_CPU_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_SUMMARY_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_SYSTEM_CPU_LABEL,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_TITLE,
    BUG_REPORT_DIAGNOSTICS_TIMELINE_WORST_LABEL,
    BUG_REPORT_SERVER_LAG_COLORS,
    BUG_REPORT_SERVER_LAG_DESCRIPTIONS,
    BUG_REPORT_SERVER_LAG_SUSPECT_LABEL,
    BUG_REPORT_SERVER_LAG_TITLES,
    formatUptime,
    getServerLagVerdict,
    getWorstServerStalls,
  } from '../../model';

  /**
   * Машина сервера мира, его нагрузка и вывод, чья это проблема.
   *
   * Loop-lag сам по себе говорит только «сервер стоял». Почему — видно из
   * нагрузки: занятое ядро процесса значит наш код, занятая машина при
   * спокойном процессе — чужие программы, а простой обоих — сон, диск или
   * подкачка. Этот блок сводит ленту нагрузки в один вывод.
   */
  const { diagnostics } = defineProps<{
    /** Разобранный снимок метрик */
    diagnostics: BugReportDiagnostics;
  }>();

  /** Вывод о причине зависаний; `null` — ленты в снимке нет */
  const verdict = computed(() => getServerLagVerdict(diagnostics));

  /** Самые долгие зависания для таблицы */
  const worstStalls = computed(() => getWorstServerStalls(diagnostics));

  /** Нагрузка в момент отправки — из последнего снапшота, пришедшего клиенту */
  const load = computed(() => diagnostics.server?.load);

  /** Пояснение к выводу: общее описание плюс подозреваемое событие */
  const verdictDescription = computed(() => {
    if (!verdict.value) {
      return '';
    }

    const description = BUG_REPORT_SERVER_LAG_DESCRIPTIONS[verdict.value.cause];

    return verdict.value.cause === 'own-code' && verdict.value.suspectEvent
      ? `${description} ${BUG_REPORT_SERVER_LAG_SUSPECT_LABEL}: ${verdict.value.suspectEvent}.`
      : description;
  });

  /** Сводка ленты: сколько интервалов из всех зависли и худший лаг */
  const verdictSummary = computed(() => {
    if (!verdict.value) {
      return '';
    }

    const { stalledSamples, totalSamples, worstLagMs } = verdict.value;

    return `${stalledSamples} / ${totalSamples}, ${BUG_REPORT_DIAGNOSTICS_TIMELINE_WORST_LABEL} ${worstLagMs.toFixed(0)} ${BUG_REPORT_DIAGNOSTICS_MS_UNIT}`;
  });

  /** Где запущен сервер: Electron с версией или голый Node */
  const runtimeLabel = computed(() => {
    const host = diagnostics.serverHost;

    if (!host) {
      return BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE;
    }

    const runtime = host.electronVersion
      ? `${BUG_REPORT_DIAGNOSTICS_ELECTRON_LABEL} ${host.electronVersion}`
      : BUG_REPORT_DIAGNOSTICS_SERVER_HEADLESS_LABEL;

    return `${runtime} · ${BUG_REPORT_DIAGNOSTICS_NODE_LABEL} ${host.nodeVersion}`;
  });

  /** Время работы процесса и машины */
  const uptimeLabel = computed(() => {
    const host = diagnostics.serverHost;

    return host
      ? `${formatUptime(host.processUptimeSec)} / ${formatUptime(host.systemUptimeSec)}`
      : BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE;
  });

  /** Память: процесс / свободно на машине / всего на машине */
  const memoryLabel = computed(() => {
    const host = diagnostics.serverHost;

    return host
      ? `${host.rssMb} / ${host.freeMemoryMb} / ${host.totalMemoryMb} ${BUG_REPORT_DIAGNOSTICS_MB_UNIT}`
      : BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE;
  });

  /**
   * Цвет загрузки процессора.
   *
   * @param percent Загрузка в процентах.
   */
  function getCpuClass(percent: number): string {
    return percent < BUG_REPORT_DIAGNOSTICS_CPU_WARN_PERCENT
      ? 'text-success'
      : 'text-warning';
  }

  /**
   * Цвет времени сборки мусора за интервал.
   *
   * @param milliseconds Время сборки мусора, мс.
   */
  function getGcClass(milliseconds: number): string {
    return milliseconds < BUG_REPORT_DIAGNOSTICS_GC_WARN_MS
      ? 'text-success'
      : 'text-warning';
  }

  /**
   * Самое тяжёлое событие интервала; прочерк — событий за интервал не было.
   *
   * @param sample Снапшот ленты.
   */
  function getSampleEventLabel(
    sample: BugReportDiagnosticsTimelineSample,
  ): string {
    return sample.heaviestEvent || BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE;
  }

  /**
   * Ключ строки таблицы: момент снапшота в ленте уникален.
   *
   * @param sample Снапшот ленты.
   */
  function getSampleKey(sample: BugReportDiagnosticsTimelineSample): string {
    return `${sample.agoSec}-${sample.lagMaxMs}`;
  }
</script>

<template>
  <section class="space-y-3 border-t border-default pt-4">
    <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">
      {{ BUG_REPORT_DIAGNOSTICS_SERVER_HOST_TITLE }}
    </h3>

    <UAlert
      v-if="verdict"
      :title="BUG_REPORT_SERVER_LAG_TITLES[verdict.cause]"
      :description="verdictDescription"
      :color="BUG_REPORT_SERVER_LAG_COLORS[verdict.cause]"
      variant="subtle"
      icon="tabler:stethoscope"
    />

    <dl class="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
      <div
        v-if="verdict"
        class="flex justify-between gap-2"
      >
        <dt class="text-muted">
          {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_SUMMARY_LABEL }}
        </dt>

        <dd class="font-mono whitespace-nowrap text-highlighted">
          {{ verdictSummary }}
        </dd>
      </div>

      <div
        v-if="load"
        class="flex justify-between gap-2"
      >
        <dt class="text-muted">
          {{ BUG_REPORT_DIAGNOSTICS_SERVER_CPU_LABEL }}
        </dt>

        <dd class="font-mono whitespace-nowrap text-highlighted">
          <span :class="getCpuClass(load.processCpuPercent)">
            {{ load.processCpuPercent.toFixed(0) }}
          </span>
          /
          <span :class="getCpuClass(load.systemCpuPercent)">
            {{ load.systemCpuPercent.toFixed(0) }}
          </span>
        </dd>
      </div>

      <div
        v-if="load"
        class="flex justify-between gap-2"
      >
        <dt class="text-muted">
          {{ BUG_REPORT_DIAGNOSTICS_SERVER_GC_LABEL }}
        </dt>

        <dd class="font-mono whitespace-nowrap text-highlighted">
          <span :class="getGcClass(load.gcMs)">
            {{ load.gcMs.toFixed(0) }}
          </span>
          / {{ load.gcMaxMs.toFixed(0) }} {{ BUG_REPORT_DIAGNOSTICS_MS_UNIT }}
        </dd>
      </div>

      <template v-if="diagnostics.serverHost">
        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SERVER_RAM_LABEL }}
          </dt>

          <dd class="font-mono whitespace-nowrap text-highlighted">
            {{ memoryLabel }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SERVER_UPTIME_LABEL }}
          </dt>

          <dd class="font-mono whitespace-nowrap text-highlighted">
            {{ uptimeLabel }}
          </dd>
        </div>

        <div class="col-span-full flex flex-col gap-0.5">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SERVER_CPU_MODEL_LABEL }}
          </dt>

          <dd class="font-mono text-xs break-all text-highlighted">
            {{ diagnostics.serverHost.cpuModel }} ×
            {{ diagnostics.serverHost.cpuCores }}
          </dd>
        </div>

        <div class="col-span-full flex flex-col gap-0.5">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SERVER_OS_LABEL }} ·
            {{ BUG_REPORT_DIAGNOSTICS_SERVER_RUNTIME_LABEL }}
          </dt>

          <dd class="font-mono text-xs break-all text-highlighted">
            {{ diagnostics.serverHost.os }} · {{ runtimeLabel }}
          </dd>
        </div>
      </template>
    </dl>

    <!-- Самые долгие зависания -->
    <div
      v-if="worstStalls.length > 0"
      class="space-y-1 pt-1"
    >
      <div class="text-xs text-muted">
        {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_TITLE }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-120 font-mono text-xs">
          <thead class="text-muted">
            <tr>
              <th class="py-1 text-left font-normal">
                {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_AGO_LABEL }}
              </th>

              <th class="py-1 text-right font-normal">
                {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_LAG_LABEL }}
              </th>

              <th class="py-1 text-right font-normal">
                {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_PROCESS_CPU_LABEL }}
              </th>

              <th class="py-1 text-right font-normal">
                {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_SYSTEM_CPU_LABEL }}
              </th>

              <th class="py-1 text-right font-normal">
                {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_GC_LABEL }}
              </th>

              <th class="py-1 pl-2 text-left font-normal">
                {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_EVENT_LABEL }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="sample in worstStalls"
              :key="getSampleKey(sample)"
              class="border-t border-default/50"
            >
              <td class="py-1 pr-2 text-dimmed">
                {{ sample.agoSec }}
                {{ BUG_REPORT_DIAGNOSTICS_TIMELINE_AGO_SUFFIX }}
              </td>

              <td class="py-1 text-right text-error">
                {{ sample.lagMaxMs.toFixed(0) }}
              </td>

              <td
                class="py-1 text-right"
                :class="getCpuClass(sample.processCpu)"
              >
                {{ sample.processCpu.toFixed(0) }}
              </td>

              <td
                class="py-1 text-right"
                :class="getCpuClass(sample.systemCpu)"
              >
                {{ sample.systemCpu.toFixed(0) }}
              </td>

              <td
                class="py-1 text-right"
                :class="getGcClass(sample.gcMs)"
              >
                {{ sample.gcMs.toFixed(0) }}
              </td>

              <td class="py-1 pl-2 break-all text-info">
                {{ getSampleEventLabel(sample) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
