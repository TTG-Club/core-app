<script setup lang="ts">
  import type {
    AdminOnlineCounters,
    AdminOnlineSiteTile,
    AdminOnlineStatsResponse,
  } from '../model';

  import {
    AdminDashboardPanel,
    AdminStatFigures,
    AdminStatTile,
  } from '~admin/dashboard/ui';

  import {
    ADMIN_ONLINE_STATS_DESCRIPTION,
    ADMIN_ONLINE_STATS_EMPTY_TEXT,
    ADMIN_ONLINE_STATS_GUESTS_LABEL,
    ADMIN_ONLINE_STATS_MINUTES_LABEL,
    ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS,
    ADMIN_ONLINE_STATS_REGISTERED_LABEL,
    ADMIN_ONLINE_STATS_TITLE,
    ADMIN_ONLINE_STATS_TOTAL_LABEL,
    ADMIN_ONLINE_STATS_VTTG_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
    ADMIN_ONLINE_STATS_WINDOW_LABEL,
    formatCounter,
    isVttgSite,
  } from '../model';
  import AdminOnlineAppTile from './AdminOnlineAppTile.vue';

  const props = defineProps<{
    hasError: boolean;
    isPending: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  /**
   * Собирает плитку сайта: гости и вошедшие в аккаунт — непересекающиеся наборы
   * ключей, поэтому главное число и есть их сумма.
   */
  function createSiteTile(
    siteId: string,
    counters: AdminOnlineCounters | null,
  ): AdminOnlineSiteTile {
    return {
      figures: [
        {
          label: ADMIN_ONLINE_STATS_GUESTS_LABEL,
          value: formatCounter(counters?.guests),
        },
        {
          label: ADMIN_ONLINE_STATS_REGISTERED_LABEL,
          value: formatCounter(counters?.registered),
        },
      ],
      siteId,
      value: formatCounter(counters?.total),
    };
  }

  /**
   * Находит счётчики площадки в ответе.
   */
  function findSiteCounters(siteId: string): AdminOnlineCounters | null {
    return (
      props.stats?.sites.find((siteStats) => siteStats.siteId === siteId)
      ?? null
    );
  }

  // Без данных панель не схлопывается: остаётся каркас из известных площадок, а
  // числа показываем скелетоном (ждём ответ) или прочерком (ответа не будет).
  const siteTiles = computed<AdminOnlineSiteTile[]>(() =>
    props.stats
      ? props.stats.sites
          .filter((siteStats) => !isVttgSite(siteStats.siteId))
          .map((siteStats) => createSiteTile(siteStats.siteId, siteStats))
      : ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS.filter(
          (siteId) => !isVttgSite(siteId),
        ).map((siteId) => createSiteTile(siteId, null)),
  );

  const appCounters = computed(() =>
    findSiteCounters(ADMIN_ONLINE_STATS_VTTG_SITE_ID),
  );

  const tableCounters = computed(() =>
    findSiteCounters(ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID),
  );

  const summaryTotal = computed(() => formatCounter(props.stats?.total.total));

  // Сообщение показываем, когда online-app ответил без сайтов, — плитка приложения
  // при этом остаётся, иначе пропажу online-данных не заметить. При ошибке и загрузке
  // говорить «сайтов нет» рано: там каркас с прочерками.
  const hasEmptySites = computed(
    () => !props.hasError && !!props.stats && !props.stats.sites.length,
  );
</script>

<template>
  <AdminDashboardPanel
    :title="ADMIN_ONLINE_STATS_TITLE"
    :hint="ADMIN_ONLINE_STATS_DESCRIPTION"
  >
    <template #meta>
      <USkeleton
        v-if="isPending"
        class="h-5 w-32"
      />

      <template v-else-if="stats">
        <UBadge
          color="neutral"
          variant="subtle"
        >
          {{ ADMIN_ONLINE_STATS_WINDOW_LABEL }}
          {{ stats.windowMinutes }}
          {{ ADMIN_ONLINE_STATS_MINUTES_LABEL }}
        </UBadge>

        <span>
          {{ ADMIN_ONLINE_STATS_TOTAL_LABEL }}
          <span class="font-semibold text-highlighted tabular-nums">
            {{ summaryTotal }}
          </span>
        </span>
      </template>
    </template>

    <p
      v-if="hasEmptySites"
      class="border-b border-dashed border-default px-4 py-2 text-xs text-muted"
    >
      {{ ADMIN_ONLINE_STATS_EMPTY_TEXT }}
    </p>

    <!-- Плитки делят ряд поровну, сколько бы площадок ни вернул online-app -->
    <div
      class="grid h-full divide-y divide-default sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0"
    >
      <AdminStatTile
        v-for="siteTile in siteTiles"
        :key="siteTile.siteId"
        :label="siteTile.siteId"
        :value="siteTile.value"
        :is-pending="isPending"
      >
        <AdminStatFigures
          :figures="siteTile.figures"
          :is-pending="isPending"
        />
      </AdminStatTile>

      <AdminOnlineAppTile
        :app-counters="appCounters"
        :is-pending="isPending"
        :table-counters="tableCounters"
      />
    </div>
  </AdminDashboardPanel>
</template>
