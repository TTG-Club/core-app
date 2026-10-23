<script setup lang="ts">
  import type {
    AdminPayment,
    AdminSubscription,
    PaymentFilterValue,
  } from '~admin/subscription-stats/model';

  import { FetchStatus } from '~/shared/consts';
  import {
    ADMIN_DASHBOARD_REFRESH_ICON,
    ADMIN_DASHBOARD_REFRESH_LABEL,
  } from '~admin/dashboard/model';
  import { AdminDashboardPanel } from '~admin/dashboard/ui';
  import {
    filterPayments,
    getSubscriptionStatsSummary,
    parseAdminPayments,
    parseAdminSubscriptions,
    PAYMENT_FILTER_DEFAULT,
    PAYMENT_FILTER_OPTIONS,
    SUBSCRIPTION_STATS_PAGE_TITLE,
    SUBSCRIPTION_STATS_PAYMENTS_API_PATH,
    SUBSCRIPTION_STATS_PAYMENTS_DATA_KEY,
    SUBSCRIPTION_STATS_PAYMENTS_EMPTY_TEXT,
    SUBSCRIPTION_STATS_PAYMENTS_ERROR_TEXT,
    SUBSCRIPTION_STATS_PAYMENTS_TITLE,
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_API_PATH,
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_DATA_KEY,
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_EMPTY_TEXT,
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_ERROR_TEXT,
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_TITLE,
    SUBSCRIPTION_STATS_SUMMARY_TITLE,
  } from '~admin/subscription-stats/model';
  import {
    PaymentHistoryRow,
    SubscriptionHistoryRow,
    SubscriptionStatsList,
    SubscriptionStatsTiles,
  } from '~admin/subscription-stats/ui';

  useSeoMeta({
    title: SUBSCRIPTION_STATS_PAGE_TITLE,
  });

  const requestFetch = useRequestFetch();

  // server: false — приватные данные subscriber-service грузим на клиенте, где
  // авторизация (cookie → Bearer → subscriber) гарантированно работает.
  const {
    data: subscriptions,
    error: subscriptionsError,
    refresh: refreshSubscriptions,
    status: subscriptionsStatus,
  } = await useAsyncData<AdminSubscription[]>(
    SUBSCRIPTION_STATS_SUBSCRIPTIONS_DATA_KEY,
    async () =>
      parseAdminSubscriptions(
        await requestFetch(SUBSCRIPTION_STATS_SUBSCRIPTIONS_API_PATH),
      ),
    { default: () => [], server: false, lazy: true },
  );

  const {
    data: payments,
    error: paymentsError,
    refresh: refreshPayments,
    status: paymentsStatus,
  } = await useAsyncData<AdminPayment[]>(
    SUBSCRIPTION_STATS_PAYMENTS_DATA_KEY,
    async () =>
      parseAdminPayments(
        await requestFetch(SUBSCRIPTION_STATS_PAYMENTS_API_PATH),
      ),
    { default: () => [], server: false, lazy: true },
  );

  // 'idle' тоже ждём: на клиенте запрос стартует после первого рендера.
  const isSubscriptionsPending = computed(
    () =>
      subscriptionsStatus.value === FetchStatus.Pending
      || subscriptionsStatus.value === FetchStatus.Idle,
  );

  const isPaymentsPending = computed(
    () =>
      paymentsStatus.value === FetchStatus.Pending
      || paymentsStatus.value === FetchStatus.Idle,
  );

  const hasSubscriptionsError = computed(() => !!subscriptionsError.value);

  const hasPaymentsError = computed(() => !!paymentsError.value);

  const isRefreshing = computed(
    () => isSubscriptionsPending.value || isPaymentsPending.value,
  );

  const subscriptionStats = computed(() =>
    getSubscriptionStatsSummary(subscriptions.value, payments.value),
  );

  const isSubscriptionsEmpty = computed(() => !subscriptions.value.length);

  const paymentFilter = ref<PaymentFilterValue>(PAYMENT_FILTER_DEFAULT);

  const filteredPayments = computed(() =>
    filterPayments(payments.value, paymentFilter.value),
  );

  const isFilteredPaymentsEmpty = computed(
    () => !filteredPayments.value.length,
  );

  const paymentsErrorText = computed(() =>
    hasPaymentsError.value ? SUBSCRIPTION_STATS_PAYMENTS_ERROR_TEXT : undefined,
  );

  const subscriptionsErrorText = computed(() =>
    hasSubscriptionsError.value
      ? SUBSCRIPTION_STATS_SUBSCRIPTIONS_ERROR_TEXT
      : undefined,
  );

  /**
   * Перезагружает подписки и платежи общей кнопкой.
   */
  async function handleRefresh(): Promise<void> {
    await Promise.all([refreshSubscriptions(), refreshPayments()]);
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="SUBSCRIPTION_STATS_PAGE_TITLE"
  >
    <div class="space-y-3">
      <AdminDashboardPanel :title="SUBSCRIPTION_STATS_SUMMARY_TITLE">
        <template #meta>
          <UButton
            :icon="ADMIN_DASHBOARD_REFRESH_ICON"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="isRefreshing"
            @click.left.exact.prevent="handleRefresh"
          >
            {{ ADMIN_DASHBOARD_REFRESH_LABEL }}
          </UButton>
        </template>

        <SubscriptionStatsTiles
          :subscription-stats="subscriptionStats"
          :is-subscriptions-pending="isSubscriptionsPending"
          :is-payments-pending="isPaymentsPending"
          :has-subscriptions-error="hasSubscriptionsError"
          :has-payments-error="hasPaymentsError"
        />
      </AdminDashboardPanel>

      <div class="grid items-start gap-3 xl:grid-cols-2">
        <AdminDashboardPanel :title="SUBSCRIPTION_STATS_PAYMENTS_TITLE">
          <template #meta>
            <USelect
              v-model="paymentFilter"
              :items="PAYMENT_FILTER_OPTIONS"
              size="xs"
              class="w-40"
            />
          </template>

          <SubscriptionStatsList
            :is-pending="isPaymentsPending"
            :is-empty="isFilteredPaymentsEmpty"
            :empty-text="SUBSCRIPTION_STATS_PAYMENTS_EMPTY_TEXT"
            :error-text="paymentsErrorText"
          >
            <PaymentHistoryRow
              v-for="payment in filteredPayments"
              :key="payment.id"
              :payment="payment"
            />
          </SubscriptionStatsList>
        </AdminDashboardPanel>

        <AdminDashboardPanel :title="SUBSCRIPTION_STATS_SUBSCRIPTIONS_TITLE">
          <SubscriptionStatsList
            :is-pending="isSubscriptionsPending"
            :is-empty="isSubscriptionsEmpty"
            :empty-text="SUBSCRIPTION_STATS_SUBSCRIPTIONS_EMPTY_TEXT"
            :error-text="subscriptionsErrorText"
          >
            <SubscriptionHistoryRow
              v-for="subscription in subscriptions"
              :key="subscription.id"
              :subscription="subscription"
            />
          </SubscriptionStatsList>
        </AdminDashboardPanel>
      </div>
    </div>
  </NuxtLayout>
</template>
