<script setup lang="ts">
  import type { AdminStatFigure } from '~admin/dashboard/model';

  import type { AdminSubscription } from '../model';

  import { ADMIN_DASHBOARD_EMPTY_VALUE } from '~admin/dashboard/model';
  import { AdminStatFigures, AdminStatTile } from '~admin/dashboard/ui';

  import {
    countActiveSubscribers,
    SUBSCRIPTION_STATS_ACTIVE_HINT,
    SUBSCRIPTION_STATS_DASHBOARD_TILE_TITLE,
    SUBSCRIPTION_STATS_NUMBER_FORMAT,
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_ERROR_TEXT,
    SUBSCRIPTION_STATS_TOTAL_HINT,
    SUBSCRIPTION_STATS_TOTAL_LABEL,
  } from '../model';

  /**
   * Подписчики на главной админки: сколько людей с подпиской сейчас и сколько
   * подписок выдано всего. Подробности — на странице статистики подписок.
   */
  const props = defineProps<{
    hasError: boolean;
    isPending: boolean;
    subscriptions: AdminSubscription[];
  }>();

  const errorText = computed(() =>
    props.hasError ? SUBSCRIPTION_STATS_SUBSCRIPTIONS_ERROR_TEXT : undefined,
  );

  /**
   * Число для плитки: если список не загрузился — прочерк, а не ложный ноль.
   */
  function formatCount(count: number): string {
    return props.hasError
      ? ADMIN_DASHBOARD_EMPTY_VALUE
      : SUBSCRIPTION_STATS_NUMBER_FORMAT.format(count);
  }

  const subscribersValue = computed(() =>
    formatCount(countActiveSubscribers(props.subscriptions)),
  );

  const subscriberFigures = computed<AdminStatFigure[]>(() => [
    {
      label: SUBSCRIPTION_STATS_TOTAL_LABEL,
      value: formatCount(props.subscriptions.length),
      hint: SUBSCRIPTION_STATS_TOTAL_HINT,
    },
  ]);
</script>

<template>
  <AdminStatTile
    :label="SUBSCRIPTION_STATS_DASHBOARD_TILE_TITLE"
    :value="subscribersValue"
    :value-hint="SUBSCRIPTION_STATS_ACTIVE_HINT"
    :error-text="errorText"
    :is-pending="isPending"
  >
    <AdminStatFigures
      :figures="subscriberFigures"
      :is-pending="isPending"
    />
  </AdminStatTile>
</template>
