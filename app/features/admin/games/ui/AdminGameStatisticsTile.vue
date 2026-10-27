<script setup lang="ts">
  import type { AdminStatFigure } from '~admin/dashboard/model';

  import type { AdminGameStatistics } from '../model';

  import { ADMIN_DASHBOARD_EMPTY_VALUE } from '~admin/dashboard/model';
  import { AdminStatFigures, AdminStatTile } from '~admin/dashboard/ui';

  import {
    ADMIN_GAME_STATISTICS_COMPLETED_LABEL,
    ADMIN_GAME_STATISTICS_ERROR_TEXT,
    ADMIN_GAME_STATISTICS_NUMBER_FORMAT,
    ADMIN_GAME_STATISTICS_TITLE,
    ADMIN_GAME_STATISTICS_TOTAL_HINT,
  } from '../model';

  const props = defineProps<{
    hasError: boolean;
    isLoading: boolean;
    statistics: AdminGameStatistics | null;
  }>();

  const isPending = computed(
    () => props.isLoading || (!props.hasError && !props.statistics),
  );

  const errorText = computed(() =>
    props.hasError ? ADMIN_GAME_STATISTICS_ERROR_TEXT : undefined,
  );

  const totalValue = computed(() =>
    props.statistics
      ? ADMIN_GAME_STATISTICS_NUMBER_FORMAT.format(props.statistics.total)
      : ADMIN_DASHBOARD_EMPTY_VALUE,
  );

  const gameFigures = computed<AdminStatFigure[]>(() => [
    {
      label: ADMIN_GAME_STATISTICS_COMPLETED_LABEL,
      value: props.statistics
        ? ADMIN_GAME_STATISTICS_NUMBER_FORMAT.format(props.statistics.completed)
        : ADMIN_DASHBOARD_EMPTY_VALUE,
    },
  ]);
</script>

<template>
  <AdminStatTile
    :label="ADMIN_GAME_STATISTICS_TITLE"
    :value="totalValue"
    :value-hint="ADMIN_GAME_STATISTICS_TOTAL_HINT"
    :error-text="errorText"
    :is-pending="isPending"
  >
    <AdminStatFigures
      :figures="gameFigures"
      :is-pending="isPending"
    />
  </AdminStatTile>
</template>
