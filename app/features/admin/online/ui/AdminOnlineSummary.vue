<script setup lang="ts">
  import type { AdminOnlineStatsResponse } from '../model';

  import { ADMIN_DASHBOARD_TOOLTIP_UI } from '~admin/dashboard/model';

  import {
    ADMIN_ONLINE_STATS_MINUTES_LABEL,
    ADMIN_ONLINE_STATS_SUMMARY_HINT,
    ADMIN_ONLINE_STATS_SUMMARY_LABEL,
    ADMIN_ONLINE_STATS_WINDOW_LABEL,
    formatCounter,
  } from '../model';

  const props = defineProps<{
    isPending: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  const summaryTotal = computed(() => formatCounter(props.stats?.total.total));
</script>

<template>
  <div class="flex items-center gap-2 text-xs text-muted">
    <USkeleton
      v-if="isPending"
      class="h-5 w-36"
    />

    <template v-else-if="stats">
      <UTooltip
        :text="ADMIN_ONLINE_STATS_SUMMARY_HINT"
        :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
      >
        <span>
          {{ ADMIN_ONLINE_STATS_SUMMARY_LABEL }}
          <span class="font-semibold text-highlighted tabular-nums">
            {{ summaryTotal }}
          </span>
        </span>
      </UTooltip>

      <UBadge
        color="neutral"
        variant="subtle"
      >
        {{ ADMIN_ONLINE_STATS_WINDOW_LABEL }}
        {{ stats.windowMinutes }}
        {{ ADMIN_ONLINE_STATS_MINUTES_LABEL }}
      </UBadge>
    </template>
  </div>
</template>
