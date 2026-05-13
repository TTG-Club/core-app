<script setup lang="ts">
  import type { AdminOnlineStatsResponse } from '../model';

  import {
    ADMIN_ONLINE_STATS_DESCRIPTION,
    ADMIN_ONLINE_STATS_EMPTY_TEXT,
    ADMIN_ONLINE_STATS_ERROR_TEXT,
    ADMIN_ONLINE_STATS_GUESTS_LABEL,
    ADMIN_ONLINE_STATS_MINUTES_LABEL,
    ADMIN_ONLINE_STATS_REFRESH_LABEL,
    ADMIN_ONLINE_STATS_REGISTERED_LABEL,
    ADMIN_ONLINE_STATS_SITE_LABEL,
    ADMIN_ONLINE_STATS_SUMMARY_LABEL,
    ADMIN_ONLINE_STATS_TITLE,
    ADMIN_ONLINE_STATS_TOTAL_LABEL,
    ADMIN_ONLINE_STATS_WINDOW_LABEL,
  } from '../model';

  defineProps<{
    hasError: boolean;
    isLoading: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  const emit = defineEmits<{
    refresh: [];
  }>();

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

    <UAlert
      v-if="hasError"
      color="error"
      variant="subtle"
      icon="tabler:alert-triangle"
      :description="ADMIN_ONLINE_STATS_ERROR_TEXT"
    />

    <div
      v-else-if="stats"
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
        <UBadge
          color="neutral"
          variant="subtle"
        >
          {{ ADMIN_ONLINE_STATS_WINDOW_LABEL }}:
          {{ stats.windowMinutes }}
          {{ ADMIN_ONLINE_STATS_MINUTES_LABEL }}
        </UBadge>

        <span>
          {{ ADMIN_ONLINE_STATS_SUMMARY_LABEL }}:
          {{ stats.total.total }}
        </span>
      </div>

      <div
        v-if="stats.sites.length"
        class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
      >
        <UCard
          v-for="siteStats in stats.sites"
          :key="siteStats.siteId"
          variant="subtle"
        >
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">{{ ADMIN_ONLINE_STATS_SITE_LABEL }}</dt>

              <dd class="font-semibold text-highlighted">
                {{ siteStats.siteId }}
              </dd>
            </div>

            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">{{ ADMIN_ONLINE_STATS_GUESTS_LABEL }}</dt>

              <dd class="font-medium text-default">{{ siteStats.guests }}</dd>
            </div>

            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted">
                {{ ADMIN_ONLINE_STATS_REGISTERED_LABEL }}
              </dt>

              <dd class="font-medium text-default">
                {{ siteStats.registered }}
              </dd>
            </div>

            <div
              class="flex items-center justify-between gap-4 border-t border-default pt-3"
            >
              <dt class="font-medium text-default">
                {{ ADMIN_ONLINE_STATS_TOTAL_LABEL }}
              </dt>

              <dd class="text-lg font-semibold text-primary">
                {{ siteStats.total }}
              </dd>
            </div>
          </dl>
        </UCard>
      </div>

      <div
        v-else
        class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
      >
        {{ ADMIN_ONLINE_STATS_EMPTY_TEXT }}
      </div>
    </div>
  </section>
</template>
