<script setup lang="ts">
  import type { AdminCharacterSheetStats } from '~admin/character-sheets/model';
  import type { AdminOnlineStatsResponse } from '~admin/online/model';

  import { FetchStatus } from '~/shared/consts';
  import {
    ADMIN_SHEET_STATS_API_URL,
    ADMIN_SHEET_STATS_DATA_KEY,
    parseAdminCharacterSheetStats,
  } from '~admin/character-sheets/model';
  import { AdminCharacterSheetStatsTile } from '~admin/character-sheets/ui';
  import {
    ADMIN_DASHBOARD_PAGE_TITLE,
    ADMIN_DASHBOARD_REFRESH_ICON,
    ADMIN_DASHBOARD_REFRESH_LABEL,
    ADMIN_DASHBOARD_SECTIONS_TITLE,
    ADMIN_DASHBOARD_STATS_TITLE,
    ADMIN_DASHBOARD_TOTALS_TITLE,
  } from '~admin/dashboard/model';
  import { AdminDashboardPanel, AdminSectionLink } from '~admin/dashboard/ui';
  import {
    ADMIN_GAME_STATISTICS_API_URL,
    ADMIN_GAME_STATISTICS_DATA_KEY,
    ADMIN_GAME_STATISTICS_REQUEST_TIMEOUT,
    parseAdminGameStatistics,
  } from '~admin/games/model';
  import { AdminGameStatisticsTile } from '~admin/games/ui';
  import { ADMIN_SECTION_ITEMS } from '~admin/navigation/model';
  import {
    ADMIN_ONLINE_STATS_API_URL,
    ADMIN_ONLINE_STATS_DATA_KEY,
    parseAdminOnlineStats,
  } from '~admin/online/model';
  import {
    AdminOnlineNowPanel,
    AdminOnlinePreferencesPanel,
  } from '~admin/online/ui';
  import { SubscriptionSalesSwitch } from '~admin/subscriptions/ui';

  const {
    data: onlineStats,
    error: onlineStatsError,
    refresh: refreshOnlineStats,
    status: onlineStatsStatus,
  } = await useAsyncData<AdminOnlineStatsResponse>(
    ADMIN_ONLINE_STATS_DATA_KEY,
    async () => parseAdminOnlineStats(await $fetch(ADMIN_ONLINE_STATS_API_URL)),
  );

  const requestFetch = useRequestFetch();

  // server: false — приватные данные админки грузим на клиенте, где авторизация
  // (cookie → Bearer) гарантированно работает; lazy — чтобы первый рендер не ждал
  // ответа (карточка сама показывает скелетон).
  const {
    data: sheetStats,
    error: sheetStatsError,
    refresh: refreshSheetStats,
    status: sheetStatsStatus,
  } = await useAsyncData<AdminCharacterSheetStats>(
    ADMIN_SHEET_STATS_DATA_KEY,
    async () =>
      parseAdminCharacterSheetStats(
        await requestFetch(ADMIN_SHEET_STATS_API_URL),
      ),
    {
      server: false,
      lazy: true,
    },
  );

  const isOnlineStatsLoading = computed(
    () => onlineStatsStatus.value === 'pending',
  );

  const hasOnlineStatsError = computed(() => !!onlineStatsError.value);

  const resolvedOnlineStats = computed(() => onlineStats.value ?? null);

  // Скелетон только пока ответа ждём: после ошибки ждать нечего — там прочерки.
  const isOnlineStatsPending = computed(
    () =>
      isOnlineStatsLoading.value
      || (!hasOnlineStatsError.value && !resolvedOnlineStats.value),
  );

  // Статус 'idle' (запрос ещё не стартовал на сервере и в первом клиентском рендере)
  // сюда не берём — иначе кнопка «Обновить» уезжала бы в SSR-разметку со спиннером.
  // Скелетон в это время держит сама карточка: данных ещё нет.
  const isSheetStatsLoading = computed(
    () => sheetStatsStatus.value === 'pending',
  );

  const hasSheetStatsError = computed(() => !!sheetStatsError.value);

  const resolvedSheetStats = computed(() => sheetStats.value ?? null);

  const {
    data: gameStatistics,
    error: gameStatisticsError,
    refresh: refreshGameStatistics,
    status: gameStatisticsStatus,
  } = await useFetch(ADMIN_GAME_STATISTICS_API_URL, {
    key: ADMIN_GAME_STATISTICS_DATA_KEY,
    server: false,
    lazy: true,
    timeout: ADMIN_GAME_STATISTICS_REQUEST_TIMEOUT,
    transform: parseAdminGameStatistics,
  });

  const isGameStatisticsLoading = computed(
    () => gameStatisticsStatus.value === FetchStatus.Pending,
  );

  const hasGameStatisticsError = computed(() => !!gameStatisticsError.value);

  const resolvedGameStatistics = computed(() => gameStatistics.value ?? null);

  const isStatsLoading = computed(
    () =>
      isOnlineStatsLoading.value
      || isSheetStatsLoading.value
      || isGameStatisticsLoading.value,
  );

  /**
   * Обновляет все показатели общей кнопкой в заголовке статистики.
   */
  async function handleStatsRefresh(): Promise<void> {
    await Promise.all([
      refreshOnlineStats(),
      refreshSheetStats(),
      refreshGameStatistics(),
    ]);
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="ADMIN_DASHBOARD_PAGE_TITLE"
  >
    <div class="space-y-6">
      <SubscriptionSalesSwitch />

      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-muted">
            {{ ADMIN_DASHBOARD_STATS_TITLE }}
          </h2>

          <UButton
            :icon="ADMIN_DASHBOARD_REFRESH_ICON"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="isStatsLoading"
            @click.left.exact.prevent="handleStatsRefresh"
          >
            {{ ADMIN_DASHBOARD_REFRESH_LABEL }}
          </UButton>
        </div>

        <div class="grid gap-3 lg:grid-cols-5">
          <AdminOnlineNowPanel
            class="lg:col-span-3"
            :stats="resolvedOnlineStats"
            :is-pending="isOnlineStatsPending"
            :has-error="hasOnlineStatsError"
          />

          <AdminDashboardPanel
            class="lg:col-span-2"
            :title="ADMIN_DASHBOARD_TOTALS_TITLE"
          >
            <div class="grid h-full grid-cols-2 divide-x divide-default">
              <ClientOnly>
                <AdminCharacterSheetStatsTile
                  :stats="resolvedSheetStats"
                  :is-loading="isSheetStatsLoading"
                  :has-error="hasSheetStatsError"
                />

                <template #fallback>
                  <AdminCharacterSheetStatsTile
                    :stats="null"
                    is-loading
                    :has-error="false"
                  />
                </template>
              </ClientOnly>

              <AdminGameStatisticsTile
                :statistics="resolvedGameStatistics"
                :is-loading="isGameStatisticsLoading"
                :has-error="hasGameStatisticsError"
              />
            </div>
          </AdminDashboardPanel>

          <AdminOnlinePreferencesPanel
            class="lg:col-span-5"
            :stats="resolvedOnlineStats"
            :is-pending="isOnlineStatsPending"
          />
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-muted">
          {{ ADMIN_DASHBOARD_SECTIONS_TITLE }}
        </h2>

        <div
          class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          <AdminSectionLink
            v-for="adminSection in ADMIN_SECTION_ITEMS"
            :key="adminSection.to"
            :section="adminSection"
          />
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>
