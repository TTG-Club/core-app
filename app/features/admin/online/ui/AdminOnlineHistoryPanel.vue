<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    AdminOnlineHistoryMetric,
    AdminOnlineHistoryMetricView,
    AdminOnlineHistoryResponse,
  } from '../model';

  import { ADMIN_DASHBOARD_TOOLTIP_UI } from '~admin/dashboard/model';
  import { AdminDashboardPanel } from '~admin/dashboard/ui';

  import {
    ADMIN_ONLINE_HISTORY_ALL_SITES,
    ADMIN_ONLINE_HISTORY_CHART_HEIGHT,
    ADMIN_ONLINE_HISTORY_DEFAULT_METRIC,
    ADMIN_ONLINE_HISTORY_DEFAULT_PERIOD,
    ADMIN_ONLINE_HISTORY_EMPTY_TEXT,
    ADMIN_ONLINE_HISTORY_ERROR_TEXT,
    ADMIN_ONLINE_HISTORY_HINT,
    ADMIN_ONLINE_HISTORY_METRIC_ACTIVE_CLASS,
    ADMIN_ONLINE_HISTORY_METRIC_HINT_DELAY,
    ADMIN_ONLINE_HISTORY_METRIC_IDLE_CLASS,
    ADMIN_ONLINE_HISTORY_METRICS,
    ADMIN_ONLINE_HISTORY_PERIODS,
    ADMIN_ONLINE_HISTORY_TITLE,
    createHistoryMetricTile,
    createHistoryPoints,
    createHistorySiteTabs,
    formatPreferencePeriod,
    hasHistoryValues,
    selectHistoryDays,
  } from '../model';
  import AdminOnlineHistoryChart from './AdminOnlineHistoryChart.vue';

  const props = defineProps<{
    hasError: boolean;
    history: AdminOnlineHistoryResponse | null;
    isPending: boolean;
  }>();

  const selectedPeriod = ref(ADMIN_ONLINE_HISTORY_DEFAULT_PERIOD);
  const selectedSite = ref(ADMIN_ONLINE_HISTORY_ALL_SITES);

  const selectedMetric = ref<AdminOnlineHistoryMetric>(
    ADMIN_ONLINE_HISTORY_DEFAULT_METRIC,
  );

  const periodTabs: Array<TabsItem> = ADMIN_ONLINE_HISTORY_PERIODS.map(
    (days) => ({
      label: formatPreferencePeriod(days),
      value: String(days),
    }),
  );

  const activePeriodTab = computed(() => String(selectedPeriod.value));

  const siteTabs = computed(() => createHistorySiteTabs(props.history));

  // Выбранная площадка пропала из ответа — показываем все вместе.
  const activeSite = computed(() =>
    siteTabs.value.some(({ value }) => value === selectedSite.value)
      ? selectedSite.value
      : ADMIN_ONLINE_HISTORY_ALL_SITES,
  );

  const days = computed(() =>
    props.history
      ? selectHistoryDays(props.history, activeSite.value, selectedPeriod.value)
      : [],
  );

  const metricTiles = computed<AdminOnlineHistoryMetricView[]>(() =>
    ADMIN_ONLINE_HISTORY_METRICS.map((section) => {
      const isActive = section.metric === selectedMetric.value;

      return {
        ...createHistoryMetricTile(section, days.value),
        className: isActive
          ? ADMIN_ONLINE_HISTORY_METRIC_ACTIVE_CLASS
          : ADMIN_ONLINE_HISTORY_METRIC_IDLE_CLASS,
        isActive,
      };
    }),
  );

  const activeMetricTile = computed(() =>
    metricTiles.value.find(({ isActive }) => isActive),
  );

  const points = computed(() =>
    createHistoryPoints(days.value, selectedMetric.value),
  );

  const hasPoints = computed(() => hasHistoryValues(points.value));

  // Ошибку показываем, только когда показать нечего: старый ответ лучше пустоты.
  const statusText = computed(() => {
    if (props.isPending || hasPoints.value) {
      return '';
    }

    return props.hasError && !props.history
      ? ADMIN_ONLINE_HISTORY_ERROR_TEXT
      : ADMIN_ONLINE_HISTORY_EMPTY_TEXT;
  });

  const placeholderStyle = {
    height: `${ADMIN_ONLINE_HISTORY_CHART_HEIGHT}px`,
  };

  /** Переключает период графика. */
  function handlePeriodChange(tabValue: string | number): void {
    const period = Number(tabValue);

    if (ADMIN_ONLINE_HISTORY_PERIODS.includes(period)) {
      selectedPeriod.value = period;
    }
  }

  /** Переключает площадку графика. */
  function handleSiteChange(tabValue: string | number): void {
    selectedSite.value = String(tabValue);
  }

  /** Выбирает показатель, который рисует график. */
  function handleMetricSelect(metric: AdminOnlineHistoryMetric): void {
    selectedMetric.value = metric;
  }
</script>

<template>
  <AdminDashboardPanel
    :title="ADMIN_ONLINE_HISTORY_TITLE"
    :hint="ADMIN_ONLINE_HISTORY_HINT"
  >
    <template #meta>
      <UTabs
        :items="periodTabs"
        :model-value="activePeriodTab"
        :content="false"
        size="xs"
        @update:model-value="handlePeriodChange"
      />
    </template>

    <div class="flex flex-col">
      <div class="border-b border-default px-4 py-2">
        <UTabs
          :items="siteTabs"
          :model-value="activeSite"
          :content="false"
          variant="link"
          size="xs"
          @update:model-value="handleSiteChange"
        />
      </div>

      <div
        class="grid grid-cols-3 divide-x divide-default border-b border-default"
      >
        <UTooltip
          v-for="metricTile in metricTiles"
          :key="metricTile.metric"
          :text="metricTile.hint"
          :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
          :delay-duration="ADMIN_ONLINE_HISTORY_METRIC_HINT_DELAY"
        >
          <button
            type="button"
            class="flex h-full min-w-0 flex-col gap-1 border-b-2 px-3 py-3 text-left transition-colors sm:px-4"
            :class="metricTile.className"
            :aria-pressed="metricTile.isActive"
            @click.left.exact.prevent="handleMetricSelect(metricTile.metric)"
          >
            <span class="text-xs/4 text-muted">{{ metricTile.label }}</span>

            <USkeleton
              v-if="isPending"
              class="h-8 w-16"
            />

            <span
              v-else
              class="text-xl/8 font-semibold text-highlighted tabular-nums sm:text-2xl/8"
            >
              {{ metricTile.value }}
            </span>

            <span class="min-h-4 text-xs/4 text-dimmed">
              {{ metricTile.caption }}
            </span>
          </button>
        </UTooltip>
      </div>

      <div class="px-2 pt-3 pb-2">
        <USkeleton
          v-if="isPending"
          class="w-full"
          :style="placeholderStyle"
        />

        <div
          v-else-if="statusText"
          class="flex items-center justify-center px-4 text-center text-sm text-muted"
          :style="placeholderStyle"
          role="status"
        >
          {{ statusText }}
        </div>

        <AdminOnlineHistoryChart
          v-else-if="activeMetricTile"
          :points="points"
          :metric="selectedMetric"
          :label="activeMetricTile.label"
        />
      </div>
    </div>
  </AdminDashboardPanel>
</template>
