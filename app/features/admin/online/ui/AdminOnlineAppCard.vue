<script setup lang="ts">
  import type { AdminOnlineAppTile, AdminOnlineCounters } from '../model';

  import {
    ADMIN_ONLINE_STATS_VTTG_APPS_HINT,
    ADMIN_ONLINE_STATS_VTTG_APPS_LABEL,
    ADMIN_ONLINE_STATS_VTTG_IDLE_HINT,
    ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_PLAYERS_HINT,
    ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL,
    ADMIN_ONLINE_STATS_VTTG_REGISTERED_HINT,
    ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL,
    ADMIN_ONLINE_STATS_VTTG_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_SITE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_TABLE_HINT,
    ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_TOTAL_HINT,
    ADMIN_ONLINE_STATS_VTTG_TOTAL_LABEL,
    formatCounter,
    formatRemainder,
    formatSum,
  } from '../model';

  const props = defineProps<{
    /** Счётчики запущенных приложений. `null` — данных ещё нет. */
    appCounters: AdminOnlineCounters | null;
    isPending: boolean;
    /** Счётчики игроков за чужими столами. `null` — данных ещё нет. */
    tableCounters: AdminOnlineCounters | null;
  }>();

  // Две аудитории приложения: это разные люди, и складываются они только в итоге внизу.
  const audienceTiles = computed<AdminOnlineAppTile[]>(() => [
    {
      hint: ADMIN_ONLINE_STATS_VTTG_APPS_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_APPS_LABEL,
      value: formatCounter(props.appCounters?.total),
    },
    {
      hint: ADMIN_ONLINE_STATS_VTTG_TABLE_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL,
      value: formatCounter(props.tableCounters?.total),
    },
  ]);

  // Доли первой аудитории, а не слагаемые: играющий под аккаунтом попадает сразу в две
  // плитки. Поэтому они мельче и приглушённее — чтобы не читались как отдельные группы.
  const detailTiles = computed<AdminOnlineAppTile[]>(() => [
    {
      hint: ADMIN_ONLINE_STATS_VTTG_PLAYERS_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL,
      value: formatCounter(props.appCounters?.players),
    },
    {
      hint: ADMIN_ONLINE_STATS_VTTG_IDLE_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL,
      value: formatRemainder(
        props.appCounters?.total,
        props.appCounters?.players,
      ),
    },
    {
      hint: ADMIN_ONLINE_STATS_VTTG_REGISTERED_HINT,
      label: ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL,
      value: formatCounter(props.appCounters?.registered),
    },
  ]);

  const totalValue = computed(() =>
    formatSum(props.appCounters?.total, props.tableCounters?.total),
  );
</script>

<template>
  <UCard variant="subtle">
    <div class="space-y-3 text-sm">
      <div class="flex items-center justify-between gap-4">
        <span class="text-muted">{{ ADMIN_ONLINE_STATS_VTTG_SITE_LABEL }}</span>

        <span class="font-semibold text-highlighted">
          {{ ADMIN_ONLINE_STATS_VTTG_SITE_ID }}
        </span>
      </div>

      <div
        class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
      >
        <UTooltip
          v-for="tile in audienceTiles"
          :key="tile.label"
          :text="tile.hint"
        >
          <span class="flex items-baseline gap-1.5">
            <span class="text-muted">{{ tile.label }}</span>

            <USkeleton
              v-if="isPending"
              class="h-4 w-6"
            />

            <span
              v-else
              class="font-medium text-default"
            >
              {{ tile.value }}
            </span>
          </span>
        </UTooltip>
      </div>

      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <UTooltip
          v-for="tile in detailTiles"
          :key="tile.label"
          :text="tile.hint"
        >
          <span class="flex items-baseline gap-1.5">
            <span class="text-dimmed">{{ tile.label }}</span>

            <USkeleton
              v-if="isPending"
              class="h-3.5 w-4"
            />

            <span
              v-else
              class="font-medium text-muted"
            >
              {{ tile.value }}
            </span>
          </span>
        </UTooltip>
      </div>

      <div
        class="flex items-center justify-between gap-4 border-t border-default pt-3"
      >
        <UTooltip :text="ADMIN_ONLINE_STATS_VTTG_TOTAL_HINT">
          <span class="font-medium text-default">
            {{ ADMIN_ONLINE_STATS_VTTG_TOTAL_LABEL }}
          </span>
        </UTooltip>

        <USkeleton
          v-if="isPending"
          class="h-7 w-12"
        />

        <span
          v-else
          class="text-lg font-semibold text-primary"
        >
          {{ totalValue }}
        </span>
      </div>
    </div>
  </UCard>
</template>
