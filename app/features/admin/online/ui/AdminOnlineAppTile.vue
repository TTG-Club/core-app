<script setup lang="ts">
  import type { AdminStatFigure } from '~admin/dashboard/model';

  import type { AdminOnlineCounters } from '../model';

  import { AdminStatFigures, AdminStatTile } from '~admin/dashboard/ui';

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
    ADMIN_ONLINE_STATS_VTTG_TABLE_HINT,
    ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_TOTAL_HINT,
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

  // Две аудитории приложения: это разные люди, и складываются они только в главном числе.
  const audienceFigures = computed<AdminStatFigure[]>(() => [
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

  // Доли первой аудитории, а не слагаемые: играющий под аккаунтом попадает сразу в два
  // числа. Поэтому они идут вторым, приглушённым рядом.
  const detailFigures = computed<AdminStatFigure[]>(() => [
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
  <AdminStatTile
    :label="ADMIN_ONLINE_STATS_VTTG_SITE_ID"
    :value="totalValue"
    :value-hint="ADMIN_ONLINE_STATS_VTTG_TOTAL_HINT"
    :is-pending="isPending"
  >
    <AdminStatFigures
      :figures="audienceFigures"
      :is-pending="isPending"
    />

    <AdminStatFigures
      :figures="detailFigures"
      :is-pending="isPending"
      is-secondary
    />
  </AdminStatTile>
</template>
