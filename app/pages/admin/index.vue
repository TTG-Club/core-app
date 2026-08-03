<script setup lang="ts">
  import type { AdminCharacterSheetStats } from '~admin/character-sheets/model';
  import type { AdminOnlineStatsResponse } from '~admin/online/model';

  import {
    ADMIN_SHEET_STATS_API_URL,
    ADMIN_SHEET_STATS_DATA_KEY,
    parseAdminCharacterSheetStats,
  } from '~admin/character-sheets/model';
  import { AdminCharacterSheetStatsCard } from '~admin/character-sheets/ui';
  import {
    ADMIN_DASHBOARD_ARTICLES_ACTION_LABEL,
    ADMIN_DASHBOARD_ARTICLES_DESCRIPTION,
    ADMIN_DASHBOARD_ARTICLES_TITLE,
    ADMIN_DASHBOARD_CONFIGURE_LABEL,
    ADMIN_DASHBOARD_PAGE_TITLE,
    ADMIN_DASHBOARD_PERSONAS_DESCRIPTION,
    ADMIN_DASHBOARD_PERSONAS_TITLE,
    ADMIN_DASHBOARD_SUBSCRIPTIONS_DESCRIPTION,
    ADMIN_DASHBOARD_SUBSCRIPTIONS_TITLE,
    ADMIN_DASHBOARD_TOKENATOR_DESCRIPTION,
    ADMIN_DASHBOARD_TOKENATOR_TITLE,
  } from '~admin/dashboard/model';
  import {
    MAILING_PAGE_DESCRIPTION,
    MAILING_PAGE_TITLE,
    MAILING_ROUTE,
  } from '~admin/mailing/model';
  import {
    ADMIN_ONLINE_STATS_API_URL,
    ADMIN_ONLINE_STATS_DATA_KEY,
    parseAdminOnlineStats,
  } from '~admin/online/model';
  import { AdminOnlineStats } from '~admin/online/ui';
  import {
    ADMIN_USERS_CONFIGURE_LABEL,
    ADMIN_USERS_NAVIGATION_LABEL,
    ADMIN_USERS_PAGE_DESCRIPTION,
  } from '~admin/users/model';
  import {
    ARTICLES_ADMIN_CREATE_ROUTE,
    ARTICLES_ADMIN_ROUTE,
  } from '~articles/model';

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

  // Статус 'idle' (запрос ещё не стартовал на сервере и в первом клиентском рендере)
  // сюда не берём — иначе кнопка «Обновить» уезжала бы в SSR-разметку со спиннером.
  // Скелетон в это время держит сама карточка: данных ещё нет.
  const isSheetStatsLoading = computed(
    () => sheetStatsStatus.value === 'pending',
  );

  const hasSheetStatsError = computed(() => !!sheetStatsError.value);

  const resolvedSheetStats = computed(() => sheetStats.value ?? null);

  const isStatsLoading = computed(
    () => isOnlineStatsLoading.value || isSheetStatsLoading.value,
  );

  /**
   * Обновляет обе статистики блока — кнопка «Обновить» в шапке одна на всю секцию.
   */
  async function handleStatsRefresh(): Promise<void> {
    await Promise.all([refreshOnlineStats(), refreshSheetStats()]);
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="ADMIN_DASHBOARD_PAGE_TITLE"
  >
    <div class="space-y-8">
      <AdminOnlineStats
        :stats="resolvedOnlineStats"
        :is-loading="isStatsLoading"
        :has-error="hasOnlineStatsError"
        @refresh="handleStatsRefresh"
      >
        <ClientOnly>
          <AdminCharacterSheetStatsCard
            :stats="resolvedSheetStats"
            :is-loading="isSheetStatsLoading"
            :has-error="hasSheetStatsError"
          />

          <template #fallback>
            <AdminCharacterSheetStatsCard
              :stats="null"
              is-loading
              :has-error="false"
            />
          </template>
        </ClientOnly>
      </AdminOnlineStats>

      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fit,minmax(360px,1fr))]"
      >
        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="truncate text-base text-highlighted">
                {{ ADMIN_DASHBOARD_TOKENATOR_TITLE }}
              </h2>

              <UButton
                size="sm"
                to="/admin/tokenator"
              >
                {{ ADMIN_DASHBOARD_CONFIGURE_LABEL }}
              </UButton>
            </div>
          </template>

          <div class="text-sm text-muted">
            {{ ADMIN_DASHBOARD_TOKENATOR_DESCRIPTION }}
          </div>
        </UCard>

        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="truncate text-base text-highlighted">
                {{ ADMIN_DASHBOARD_PERSONAS_TITLE }}
              </h2>

              <UButton
                size="sm"
                to="/admin/personas"
              >
                {{ ADMIN_DASHBOARD_CONFIGURE_LABEL }}
              </UButton>
            </div>
          </template>

          <div class="text-sm text-muted">
            {{ ADMIN_DASHBOARD_PERSONAS_DESCRIPTION }}
          </div>
        </UCard>

        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="truncate text-base text-highlighted">
                {{ ADMIN_USERS_NAVIGATION_LABEL }}
              </h2>

              <UButton
                size="sm"
                to="/admin/users"
              >
                {{ ADMIN_USERS_CONFIGURE_LABEL }}
              </UButton>
            </div>
          </template>

          <div class="text-sm text-muted">
            {{ ADMIN_USERS_PAGE_DESCRIPTION }}
          </div>
        </UCard>

        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="truncate text-base text-highlighted">
                {{ ADMIN_DASHBOARD_SUBSCRIPTIONS_TITLE }}
              </h2>

              <UButton
                size="sm"
                to="/admin/subscriptions"
              >
                {{ ADMIN_DASHBOARD_CONFIGURE_LABEL }}
              </UButton>
            </div>
          </template>

          <div class="text-sm text-muted">
            {{ ADMIN_DASHBOARD_SUBSCRIPTIONS_DESCRIPTION }}
          </div>
        </UCard>

        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="truncate text-base text-highlighted">
                {{ ADMIN_DASHBOARD_ARTICLES_TITLE }}
              </h2>

              <div class="flex shrink-0 items-center gap-2">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  :to="ARTICLES_ADMIN_ROUTE"
                >
                  {{ ADMIN_DASHBOARD_CONFIGURE_LABEL }}
                </UButton>

                <UTooltip :text="ADMIN_DASHBOARD_ARTICLES_ACTION_LABEL">
                  <UButton
                    size="sm"
                    icon="tabler:plus"
                    :to="ARTICLES_ADMIN_CREATE_ROUTE"
                    :aria-label="ADMIN_DASHBOARD_ARTICLES_ACTION_LABEL"
                  />
                </UTooltip>
              </div>
            </div>
          </template>

          <div class="text-sm text-muted">
            {{ ADMIN_DASHBOARD_ARTICLES_DESCRIPTION }}
          </div>
        </UCard>

        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="truncate text-base text-highlighted">
                {{ MAILING_PAGE_TITLE }}
              </h2>

              <UButton
                size="sm"
                :to="MAILING_ROUTE"
              >
                {{ ADMIN_DASHBOARD_CONFIGURE_LABEL }}
              </UButton>
            </div>
          </template>

          <div class="text-sm text-muted">
            {{ MAILING_PAGE_DESCRIPTION }}
          </div>
        </UCard>
      </div>
    </div>
  </NuxtLayout>
</template>
