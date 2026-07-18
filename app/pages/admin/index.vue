<script setup lang="ts">
  import type { AdminOnlineStatsResponse } from '~admin/online/model';

  import {
    ADMIN_DASHBOARD_ARTICLES_ACTION_LABEL,
    ADMIN_DASHBOARD_ARTICLES_DESCRIPTION,
    ADMIN_DASHBOARD_ARTICLES_TITLE,
    ADMIN_DASHBOARD_COMMENTS_ACTION_LABEL,
    ADMIN_DASHBOARD_COMMENTS_DESCRIPTION,
    ADMIN_DASHBOARD_COMMENTS_TITLE,
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
    ADMIN_ONLINE_STATS_API_URL,
    ADMIN_ONLINE_STATS_DATA_KEY,
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
    () => $fetch<AdminOnlineStatsResponse>(ADMIN_ONLINE_STATS_API_URL),
  );

  const isOnlineStatsLoading = computed(
    () => onlineStatsStatus.value === 'pending',
  );

  const hasOnlineStatsError = computed(() => !!onlineStatsError.value);

  const resolvedOnlineStats = computed(() => onlineStats.value ?? null);
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="ADMIN_DASHBOARD_PAGE_TITLE"
  >
    <div class="space-y-8">
      <AdminOnlineStats
        :stats="resolvedOnlineStats"
        :is-loading="isOnlineStatsLoading"
        :has-error="hasOnlineStatsError"
        @refresh="refreshOnlineStats"
      />

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
                {{ ADMIN_DASHBOARD_COMMENTS_TITLE }}
              </h2>

              <UButton
                size="sm"
                to="/admin/comments"
              >
                {{ ADMIN_DASHBOARD_COMMENTS_ACTION_LABEL }}
              </UButton>
            </div>
          </template>

          <div class="text-sm text-muted">
            {{ ADMIN_DASHBOARD_COMMENTS_DESCRIPTION }}
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
      </div>
    </div>
  </NuxtLayout>
</template>
