<script setup lang="ts">
  import type { AdminStatFigure } from '~admin/dashboard/model';

  import type { SubscriptionStatsSummary } from '../model';

  import { ADMIN_DASHBOARD_EMPTY_VALUE } from '~admin/dashboard/model';
  import { AdminStatFigures, AdminStatTile } from '~admin/dashboard/ui';

  import {
    getAverageCheck,
    SUBSCRIPTION_STATS_ACTIVE_BOUGHT_LABEL,
    SUBSCRIPTION_STATS_ACTIVE_GIFTED_LABEL,
    SUBSCRIPTION_STATS_ACTIVE_HINT,
    SUBSCRIPTION_STATS_ACTIVE_LABEL,
    SUBSCRIPTION_STATS_AVERAGE_CHECK_LABEL,
    SUBSCRIPTION_STATS_MONEY_FORMAT,
    SUBSCRIPTION_STATS_NUMBER_FORMAT,
    SUBSCRIPTION_STATS_PAID_MONTHS_LABEL,
    SUBSCRIPTION_STATS_PAYING_USERS_LABEL,
    SUBSCRIPTION_STATS_PAYMENTS_ERROR_TEXT,
    SUBSCRIPTION_STATS_PURCHASES_HINT,
    SUBSCRIPTION_STATS_PURCHASES_LABEL,
    SUBSCRIPTION_STATS_REVENUE_HINT,
    SUBSCRIPTION_STATS_REVENUE_LABEL,
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_ERROR_TEXT,
    SUBSCRIPTION_STATS_TOTAL_HINT,
    SUBSCRIPTION_STATS_TOTAL_LABEL,
    SUBSCRIPTION_STATS_UNPAID_HINT,
    SUBSCRIPTION_STATS_UNPAID_LABEL,
  } from '../model';

  const props = defineProps<{
    subscriptionStats: SubscriptionStatsSummary;
    isSubscriptionsPending: boolean;
    isPaymentsPending: boolean;
    hasSubscriptionsError: boolean;
    hasPaymentsError: boolean;
  }>();

  const subscriptionsErrorText = computed(() =>
    props.hasSubscriptionsError
      ? SUBSCRIPTION_STATS_SUBSCRIPTIONS_ERROR_TEXT
      : undefined,
  );

  const paymentsErrorText = computed(() =>
    props.hasPaymentsError ? SUBSCRIPTION_STATS_PAYMENTS_ERROR_TEXT : undefined,
  );

  /**
   * Число подписок для плитки: если список не загрузился — прочерк, а не ложный ноль.
   */
  function formatSubscriptionCount(count: number): string {
    return props.hasSubscriptionsError
      ? ADMIN_DASHBOARD_EMPTY_VALUE
      : SUBSCRIPTION_STATS_NUMBER_FORMAT.format(count);
  }

  /**
   * Число по платежам для плитки: если платежи не загрузились — прочерк.
   */
  function formatPaymentCount(count: number): string {
    return props.hasPaymentsError
      ? ADMIN_DASHBOARD_EMPTY_VALUE
      : SUBSCRIPTION_STATS_NUMBER_FORMAT.format(count);
  }

  /**
   * Сумма для плитки: без платежей или без данных — прочерк.
   */
  function formatMoney(amount: number | undefined): string {
    return props.hasPaymentsError || amount === undefined
      ? ADMIN_DASHBOARD_EMPTY_VALUE
      : SUBSCRIPTION_STATS_MONEY_FORMAT.format(amount);
  }

  const activeSubscribersValue = computed(() =>
    formatSubscriptionCount(props.subscriptionStats.activeSubscribers),
  );

  const activeFigures = computed<AdminStatFigure[]>(() => [
    {
      label: SUBSCRIPTION_STATS_ACTIVE_BOUGHT_LABEL,
      value: formatSubscriptionCount(props.subscriptionStats.activeBought),
    },
    {
      label: SUBSCRIPTION_STATS_ACTIVE_GIFTED_LABEL,
      value: formatSubscriptionCount(props.subscriptionStats.activeGifted),
    },
    {
      label: SUBSCRIPTION_STATS_TOTAL_LABEL,
      value: formatSubscriptionCount(
        props.subscriptionStats.totalSubscriptions,
      ),
      hint: SUBSCRIPTION_STATS_TOTAL_HINT,
    },
  ]);

  const purchasesValue = computed(() =>
    formatPaymentCount(props.subscriptionStats.paidPayments),
  );

  const purchasesFigures = computed<AdminStatFigure[]>(() => [
    {
      label: SUBSCRIPTION_STATS_PAYING_USERS_LABEL,
      value: formatPaymentCount(props.subscriptionStats.payingUsers),
    },
    {
      label: SUBSCRIPTION_STATS_PAID_MONTHS_LABEL,
      value: formatPaymentCount(props.subscriptionStats.paidMonths),
    },
    {
      label: SUBSCRIPTION_STATS_UNPAID_LABEL,
      value: formatPaymentCount(props.subscriptionStats.unpaidPayments),
      hint: SUBSCRIPTION_STATS_UNPAID_HINT,
    },
  ]);

  const revenueValue = computed(() =>
    formatMoney(props.subscriptionStats.revenue),
  );

  const revenueFigures = computed<AdminStatFigure[]>(() => [
    {
      label: SUBSCRIPTION_STATS_AVERAGE_CHECK_LABEL,
      value: formatMoney(getAverageCheck(props.subscriptionStats)),
    },
  ]);
</script>

<template>
  <div
    class="grid divide-y divide-default sm:grid-cols-3 sm:divide-x sm:divide-y-0"
  >
    <AdminStatTile
      :label="SUBSCRIPTION_STATS_ACTIVE_LABEL"
      :value="activeSubscribersValue"
      :value-hint="SUBSCRIPTION_STATS_ACTIVE_HINT"
      :error-text="subscriptionsErrorText"
      :is-pending="isSubscriptionsPending"
    >
      <AdminStatFigures
        :figures="activeFigures"
        :is-pending="isSubscriptionsPending"
      />
    </AdminStatTile>

    <AdminStatTile
      :label="SUBSCRIPTION_STATS_PURCHASES_LABEL"
      :value="purchasesValue"
      :value-hint="SUBSCRIPTION_STATS_PURCHASES_HINT"
      :error-text="paymentsErrorText"
      :is-pending="isPaymentsPending"
    >
      <AdminStatFigures
        :figures="purchasesFigures"
        :is-pending="isPaymentsPending"
      />
    </AdminStatTile>

    <AdminStatTile
      :label="SUBSCRIPTION_STATS_REVENUE_LABEL"
      :value="revenueValue"
      :value-hint="SUBSCRIPTION_STATS_REVENUE_HINT"
      :error-text="paymentsErrorText"
      :is-pending="isPaymentsPending"
    >
      <AdminStatFigures
        :figures="revenueFigures"
        :is-pending="isPaymentsPending"
      />
    </AdminStatTile>
  </div>
</template>
