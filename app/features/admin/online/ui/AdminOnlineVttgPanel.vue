<script setup lang="ts">
  import type { AdminStatFigure } from '~admin/dashboard/model';

  import type { AdminOnlineCounters, AdminOnlineStatsResponse } from '../model';

  import { ADMIN_DASHBOARD_TOOLTIP_UI } from '~admin/dashboard/model';
  import {
    AdminDashboardPanel,
    AdminStatFigures,
    AdminStatTile,
  } from '~admin/dashboard/ui';

  import {
    ADMIN_ONLINE_STATS_TOTAL_LABEL,
    ADMIN_ONLINE_STATS_VTTG_APPS_HINT,
    ADMIN_ONLINE_STATS_VTTG_APPS_LABEL,
    ADMIN_ONLINE_STATS_VTTG_DESCRIPTION,
    ADMIN_ONLINE_STATS_VTTG_IDLE_HINT,
    ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_PLAYERS_HINT,
    ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL,
    ADMIN_ONLINE_STATS_VTTG_REGISTERED_HINT,
    ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL,
    ADMIN_ONLINE_STATS_VTTG_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_TABLE_HINT,
    ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_TITLE,
    ADMIN_ONLINE_STATS_VTTG_TOTAL_HINT,
    formatCounter,
    formatRemainder,
    formatSum,
  } from '../model';

  const props = defineProps<{
    isPending: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  /**
   * Находит счётчики площадки в ответе.
   */
  function findSiteCounters(siteId: string): AdminOnlineCounters | null {
    return (
      props.stats?.sites.find((siteStats) => siteStats.siteId === siteId)
      ?? null
    );
  }

  // Две аудитории приложения — разные люди: запущенные приложения и игроки за чужими
  // столами. Складываются они только в итоге панели.
  const appCounters = computed(() =>
    findSiteCounters(ADMIN_ONLINE_STATS_VTTG_SITE_ID),
  );

  const tableCounters = computed(() =>
    findSiteCounters(ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID),
  );

  const appsValue = computed(() => formatCounter(appCounters.value?.total));

  const tableValue = computed(() => formatCounter(tableCounters.value?.total));

  // Доли запущенных приложений, а не слагаемые: играющий под аккаунтом попадает сразу
  // в два числа.
  const appFigures = computed<AdminStatFigure[]>(() => [
    {
      hint: ADMIN_ONLINE_STATS_VTTG_PLAYERS_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL,
      value: formatCounter(appCounters.value?.players),
    },
    {
      hint: ADMIN_ONLINE_STATS_VTTG_IDLE_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL,
      value: formatRemainder(
        appCounters.value?.total,
        appCounters.value?.players,
      ),
    },
    {
      hint: ADMIN_ONLINE_STATS_VTTG_REGISTERED_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL,
      value: formatCounter(appCounters.value?.registered),
    },
  ]);

  const totalValue = computed(() =>
    formatSum(appCounters.value?.total, tableCounters.value?.total),
  );
</script>

<template>
  <AdminDashboardPanel
    :title="ADMIN_ONLINE_STATS_VTTG_TITLE"
    :hint="ADMIN_ONLINE_STATS_VTTG_DESCRIPTION"
  >
    <template #meta>
      <USkeleton
        v-if="isPending"
        class="h-4 w-14"
      />

      <UTooltip
        v-else
        :text="ADMIN_ONLINE_STATS_VTTG_TOTAL_HINT"
        :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
      >
        <span>
          {{ ADMIN_ONLINE_STATS_TOTAL_LABEL }}
          <span class="font-semibold text-highlighted tabular-nums">
            {{ totalValue }}
          </span>
        </span>
      </UTooltip>
    </template>

    <div class="grid h-full grid-cols-2 divide-x divide-default">
      <AdminStatTile
        :label="ADMIN_ONLINE_STATS_VTTG_APPS_LABEL"
        :value="appsValue"
        :value-hint="ADMIN_ONLINE_STATS_VTTG_APPS_HINT"
        :is-pending="isPending"
      >
        <AdminStatFigures
          :figures="appFigures"
          :is-pending="isPending"
        />
      </AdminStatTile>

      <AdminStatTile
        :label="ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL"
        :value="tableValue"
        :value-hint="ADMIN_ONLINE_STATS_VTTG_TABLE_HINT"
        :is-pending="isPending"
      />
    </div>
  </AdminDashboardPanel>
</template>
