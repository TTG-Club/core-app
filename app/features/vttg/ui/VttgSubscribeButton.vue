<script setup lang="ts">
  import { PUBLIC_OFFER_ROUTE } from '~infrastructure/public-offer/model';

  import { useSubscriptionPayment } from '../composables';
  import {
    VTTG_SUBSCRIBE_BUTTON,
    VTTG_SUBSCRIPTION_PAY_BUTTON,
    VTTG_SUBSCRIPTION_PAYMENT_TEXT,
  } from '../model';

  // Оплата пока открыта только администраторам: остальные видят выключенную кнопку «скоро».
  const { isAdmin } = useUserRoles();
  const { isPending, startPayment } = useSubscriptionPayment();
</script>

<template>
  <div
    v-if="isAdmin"
    class="flex flex-col gap-2"
  >
    <UButton
      v-bind="VTTG_SUBSCRIPTION_PAY_BUTTON"
      :loading="isPending"
      class="justify-center"
      @click.left.exact.prevent="startPayment"
    />

    <p class="max-w-72 text-xs text-muted">
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
