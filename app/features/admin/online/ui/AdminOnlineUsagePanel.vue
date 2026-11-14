<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    AdminOnlineSiteTile,
    AdminOnlineStatsResponse,
    AdminOnlineUsageSection,
  } from '../model';

  import {
    AdminDashboardPanel,
    AdminStatFigures,
    AdminStatTile,
  } from '~admin/dashboard/ui';

  import {
    ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS,
    ADMIN_ONLINE_USAGE_USERS_HINT,
    collectUsagePeriods,
    createUsageTile,
    findUsagePeriod,
    formatPreferencePeriod,
    isVttgSite,
  } from '../model';

  const props = defineProps<{
    isPending: boolean;
    /** Инструмент, чью статистику показывает панель */
    section: AdminOnlineUsageSection;
    stats: AdminOnlineStatsResponse | null;
  }>();

  // Инструменты есть только на сайтах: у приложения VTTG своя панель
  const sites = computed(() =>
    (props.stats?.sites ?? []).filter(({ siteId }) => !isVttgSite(siteId)),
  );

  const usagePeriods = computed(() =>
    collectUsagePeriods(sites.value, props.section.feature),
  );

  const selectedUsagePeriod = ref<number | null>(null);

  // Пока период не выбран вручную, показываем самый короткий: «сегодня» ближе всего
  // к «пользуются ли сейчас». Выбранный период пропал из ответа — тоже к нему.
  const activeUsagePeriod = computed(() =>
    selectedUsagePeriod.value !== null
    && usagePeriods.value.includes(selectedUsagePeriod.value)
      ? selectedUsagePeriod.value
      : (usagePeriods.value[0] ?? null),
  );

  const usagePeriodTabs = computed<Array<TabsItem>>(() =>
    usagePeriods.value.map((days) => ({
      label: formatPreferencePeriod(days),
      value: String(days),
    })),
  );

  const hasUsagePeriodTabs = computed(() => !!usagePeriodTabs.value.length);

  const activeUsagePeriodTab = computed(() =>
    activeUsagePeriod.value === null
      ? undefined
      : String(activeUsagePeriod.value),
  );

  // Без данных панель не схлопывается: остаётся каркас из известных сайтов, а
  // числа показываем скелетоном (ждём ответ) или прочерком (ответа не будет).
  const siteTiles = computed<AdminOnlineSiteTile[]>(() =>
    props.stats
      ? sites.value.map((site) =>
          createUsageTile(
            site.siteId,
            findUsagePeriod(
              site,
              props.section.feature,
              activeUsagePeriod.value,
            ),
          ),
        )
      : ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS.filter(
          (siteId) => !isVttgSite(siteId),
        ).map((siteId) => createUsageTile(siteId, null)),
  );

  /**
   * Переключает период, за который показана работа с инструментом.
   */
  function handleUsagePeriodChange(tabValue: string | number): void {
    const days = Number(tabValue);

    if (Number.isInteger(days)) {
      selectedUsagePeriod.value = days;
    }
  }
</script>

<template>
  <AdminDashboardPanel
    :title="section.title"
    :hint="section.hint"
  >
    <template
      v-if="hasUsagePeriodTabs"
      #meta
    >
      <UTabs
        :items="usagePeriodTabs"
        :model-value="activeUsagePeriodTab"
        :content="false"
        size="xs"
        @update:model-value="handleUsagePeriodChange"
      />
    </template>

    <!-- Плитки делят ряд поровну, сколько бы сайтов ни вернул online-app -->
    <div class="grid h-full auto-cols-fr grid-flow-col divide-x divide-default">
      <AdminStatTile
        v-for="siteTile in siteTiles"
        :key="siteTile.siteId"
        :label="siteTile.siteId"
        :value="siteTile.value"
        :value-hint="ADMIN_ONLINE_USAGE_USERS_HINT"
        :is-pending="isPending"
      >
        <AdminStatFigures
          :figures="siteTile.figures"
          :is-pending="isPending"
        />
      </AdminStatTile>
    </div>
  </AdminDashboardPanel>
</template>
