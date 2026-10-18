<script setup lang="ts">
  import type { AdminStatFigure } from '~admin/dashboard/model';

  import type { AdminCharacterSheetStats } from '../model';

  import { ADMIN_DASHBOARD_EMPTY_VALUE } from '~admin/dashboard/model';
  import { AdminStatFigures, AdminStatTile } from '~admin/dashboard/ui';

  import {
    ADMIN_SHEET_STATS_ACTIVE_LABEL,
    ADMIN_SHEET_STATS_ERROR_TEXT,
    ADMIN_SHEET_STATS_SITE_VALUE,
    ADMIN_SHEET_STATS_TITLE,
    ADMIN_SHEET_STATS_TOTAL_HINT,
  } from '../model';

  const props = defineProps<{
    hasError: boolean;
    isLoading: boolean;
    stats: AdminCharacterSheetStats | null;
  }>();

  // Данных ещё нет — значит запрос впереди или в пути (на сервере и в первом
  // клиентском рендере статус useAsyncData ещё 'idle'). После ошибки ждать нечего.
  const isPending = computed(
    () => props.isLoading || (!props.hasError && !props.stats),
  );

  const errorText = computed(() =>
    props.hasError ? ADMIN_SHEET_STATS_ERROR_TEXT : undefined,
  );

  const totalValue = computed(() =>
    props.stats ? String(props.stats.total) : ADMIN_DASHBOARD_EMPTY_VALUE,
  );

  const sheetFigures = computed<AdminStatFigure[]>(() => [
    {
      label: ADMIN_SHEET_STATS_ACTIVE_LABEL,
      value: props.stats
        ? String(props.stats.active)
        : ADMIN_DASHBOARD_EMPTY_VALUE,
    },
  ]);
</script>

<template>
  <AdminStatTile
    :label="ADMIN_SHEET_STATS_TITLE"
    :badge="ADMIN_SHEET_STATS_SITE_VALUE"
    :value="totalValue"
    :value-hint="ADMIN_SHEET_STATS_TOTAL_HINT"
    :error-text="errorText"
    :is-pending="isPending"
  >
    <AdminStatFigures
      :figures="sheetFigures"
      :is-pending="isPending"
    />
  </AdminStatTile>
</template>
