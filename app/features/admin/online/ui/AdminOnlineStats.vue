<script setup lang="ts">
  import type {
    AdminOnlineCounters,
    AdminOnlineSiteCard,
    AdminOnlineSiteCardRow,
    AdminOnlineStatsResponse,
  } from '../model';

  import {
    ADMIN_ONLINE_STATS_DESCRIPTION,
    ADMIN_ONLINE_STATS_EMPTY_TEXT,
    ADMIN_ONLINE_STATS_GUESTS_LABEL,
    ADMIN_ONLINE_STATS_MINUTES_LABEL,
    ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS,
    ADMIN_ONLINE_STATS_REFRESH_LABEL,
    ADMIN_ONLINE_STATS_REGISTERED_LABEL,
    ADMIN_ONLINE_STATS_SITE_LABEL,
    ADMIN_ONLINE_STATS_SUMMARY_LABEL,
    ADMIN_ONLINE_STATS_TITLE,
    ADMIN_ONLINE_STATS_TOTAL_LABEL,
    ADMIN_ONLINE_STATS_VTTG_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
    ADMIN_ONLINE_STATS_WINDOW_LABEL,
    formatCounter,
    isVttgSite,
  } from '../model';
  import AdminOnlineAppCard from './AdminOnlineAppCard.vue';
  import AdminOnlineStatsRow from './AdminOnlineStatsRow.vue';

  const props = defineProps<{
    hasError: boolean;
    isLoading: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  const emit = defineEmits<{
    refresh: [];
  }>();

  // Скелетон только пока ответа ждём: после ошибки ждать нечего — там прочерки.
  const isPending = computed(
    () => props.isLoading || (!props.hasError && !props.stats),
  );

  /**
   * Собирает строки карточки сайта: гости и вошедшие в аккаунт — непересекающиеся
   * наборы ключей, поэтому итог внизу и есть их сумма.
   */
  function createSiteRows(
    counters: AdminOnlineCounters | null,
  ): AdminOnlineSiteCardRow[] {
    return [
      {
        divider: 'none',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_GUESTS_LABEL,
        value: formatCounter(counters?.guests),
      },
      {
        divider: 'none',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_REGISTERED_LABEL,
        value: formatCounter(counters?.registered),
      },
      {
        divider: 'above',
        isTotal: true,
        label: ADMIN_ONLINE_STATS_TOTAL_LABEL,
        value: formatCounter(counters?.total),
      },
    ];
  }

  /**
   * Собирает карточку сайта.
   */
  function createSiteCard(
    siteId: string,
    counters: AdminOnlineCounters | null,
  ): AdminOnlineSiteCard {
    return {
      rows: createSiteRows(counters),
      siteId,
      siteLabel: ADMIN_ONLINE_STATS_SITE_LABEL,
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

  // Без данных сетка не схлопывается: остаётся каркас из известных площадок, а
  // числа показываем скелетоном (ждём ответ) или прочерком (ответа не будет).
  const siteCards = computed<AdminOnlineSiteCard[]>(() =>
    props.stats
      ? props.stats.sites
          .filter((siteStats) => !isVttgSite(siteStats.siteId))
          .map((siteStats) => createSiteCard(siteStats.siteId, siteStats))
      : ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS.filter(
          (siteId) => !isVttgSite(siteId),
        ).map((siteId) => createSiteCard(siteId, null)),
  );

  const appCounters = computed(() =>
    findSiteCounters(ADMIN_ONLINE_STATS_VTTG_SITE_ID),
  );

  const tableCounters = computed(() =>
    findSiteCounters(ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID),
  );

  const summaryTotal = computed(() => formatCounter(props.stats?.total.total));

  // Сообщение показываем, когда online-app ответил без сайтов, — даже если сетка
  // рендерится ради карточек из слота, иначе пропажу online-данных не заметить.
  // При ошибке и загрузке говорить «сайтов нет» рано: там каркас с прочерками.
  const hasEmptySites = computed(
    () => !props.hasError && !!props.stats && !props.stats.sites.length,
  );

  /**
   * Запрашивает актуальные данные online-статистики.
   */
  function handleRefresh(): void {
    emit('refresh');
  }
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ ADMIN_ONLINE_STATS_TITLE }}
        </h2>

        <p class="text-sm text-muted">
          {{ ADMIN_ONLINE_STATS_DESCRIPTION }}
        </p>
      </div>

      <UButton
        icon="tabler:refresh"
        variant="subtle"
        size="sm"
        :loading="isLoading"
        @click.left.exact.prevent="handleRefresh"
      >
        {{ ADMIN_ONLINE_STATS_REFRESH_LABEL }}
      </UButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
      <USkeleton
        v-if="isPending"
        class="h-5 w-28 rounded-full"
      />

      <UBadge
        v-else-if="stats"
        color="neutral"
        variant="subtle"
      >
        {{ ADMIN_ONLINE_STATS_WINDOW_LABEL }}:
        {{ stats.windowMinutes }}
        {{ ADMIN_ONLINE_STATS_MINUTES_LABEL }}
      </UBadge>

      <USkeleton
        v-if="isPending"
        class="h-5 w-24"
      />

      <span v-else>
        {{ ADMIN_ONLINE_STATS_SUMMARY_LABEL }}:
        {{ summaryTotal }}
      </span>
    </div>

    <div
      v-if="hasEmptySites"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
    >
      {{ ADMIN_ONLINE_STATS_EMPTY_TEXT }}
    </div>

    <!--
      Минимум колонки задаёт карточка приложения: в ней самая длинная строка — три
      плитки-числа в ряд. На 220px они переносились, и карточка снова становилась выше
      соседних. Карточкам сайтов лишняя ширина не мешает, им и так просторно.
    -->
    <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      <UCard
        v-for="card in siteCards"
        :key="card.siteId"
        variant="subtle"
      >
        <dl class="space-y-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">{{ card.siteLabel }}</dt>

            <dd class="font-semibold text-highlighted">
              {{ card.siteId }}
            </dd>
          </div>

          <AdminOnlineStatsRow
            v-for="row in card.rows"
            :key="row.label"
            :is-pending="isPending"
            :row="row"
          />
        </dl>
      </UCard>

      <AdminOnlineAppCard
        :app-counters="appCounters"
        :is-pending="isPending"
        :table-counters="tableCounters"
      />

      <slot />
    </div>
  </section>
</template>
