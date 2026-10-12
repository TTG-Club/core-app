<script setup lang="ts">
  import { PUBLIC_OFFER_ROUTE } from '~infrastructure/public-offer/model';

  import { useSubscriptionPayment } from '../composables';
  import {
    getSubscriptionPaymentTotal,
    SUBSCRIPTION_PAYMENT_MONTHS,
    VTTG_SUBSCRIBE_BUTTON,
    VTTG_SUBSCRIPTION_PAY_BUTTON,
    VTTG_SUBSCRIPTION_PAYMENT_TEXT,
    VTTG_SUBSCRIPTION_PRICE,
  } from '../model';

  // Оплата пока открыта только администраторам: остальные видят выключенную кнопку «скоро».
  const { isAdmin } = useUserRoles();
  const { isPending, startPayment } = useSubscriptionPayment();

  const months = ref<number>(SUBSCRIPTION_PAYMENT_MONTHS.default);

  const payLabel = computed(
    () =>
      `${VTTG_SUBSCRIPTION_PAYMENT_TEXT.payLabel} ${getSubscriptionPaymentTotal(months.value)} ${VTTG_SUBSCRIPTION_PRICE.currency}`,
  );

  /** Создаёт платёж за выбранный срок и уводит на форму оплаты. */
  function handlePayClick() {
    startPayment(months.value);
  }
</script>

<template>
  <div
    v-if="isAdmin"
    class="flex flex-col gap-2"
  >
    <div class="flex flex-col gap-3 sm:flex-row">
      <UInputNumber
        v-model="months"
        :min="SUBSCRIPTION_PAYMENT_MONTHS.min"
        :max="SUBSCRIPTION_PAYMENT_MONTHS.max"
        :aria-label="VTTG_SUBSCRIPTION_PAYMENT_TEXT.monthsLabel"
        :disabled="isPending"
        size="xl"
        class="sm:w-32"
      />

      <UButton
        v-bind="VTTG_SUBSCRIPTION_PAY_BUTTON"
        :label="payLabel"
        :loading="isPending"
        class="justify-center"
        @click.left.exact.prevent="handlePayClick"
      />
    </div>

    <p class="max-w-96 text-xs text-muted">
      {{ VTTG_SUBSCRIPTION_PAYMENT_TEXT.monthsLabel }}:
      {{ SUBSCRIPTION_PAYMENT_MONTHS.min }}–{{
        SUBSCRIPTION_PAYMENT_MONTHS.max
      }}.
      {{ VTTG_SUBSCRIPTION_PAYMENT_TEXT.noRenewal }}
      {{ VTTG_SUBSCRIPTION_PAYMENT_TEXT.offerNote }}

      <ULink
        :to="PUBLIC_OFFER_ROUTE"
        class="text-primary"
      >
        {{ VTTG_SUBSCRIPTION_PAYMENT_TEXT.offerLink }}</ULink
      >. {{ VTTG_SUBSCRIPTION_PAYMENT_TEXT.adminOnly }}
    </p>
  </div>

  <UButton
    v-else
    v-bind="VTTG_SUBSCRIBE_BUTTON"
    class="justify-center"
  />
</template>
