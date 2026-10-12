<script setup lang="ts">
  import {
    VTTG_SUBSCRIBE_BUTTON,
    VTTG_SUBSCRIPTION_BUY_BUTTON,
  } from '../model';
  import VttgSubscriptionPurchaseModal from './VttgSubscriptionPurchaseModal.vue';

  // Покупка пока открыта только администраторам: остальные видят выключенную кнопку «скоро».
  const { isAdmin } = useUserRoles();

  const overlay = useOverlay();
  const purchaseModal = overlay.create(VttgSubscriptionPurchaseModal);

  /** Открывает окно покупки подписки. */
  function handleBuyClick() {
    purchaseModal.open();
  }
</script>

<template>
  <UButton
    v-if="isAdmin"
    v-bind="VTTG_SUBSCRIPTION_BUY_BUTTON"
    class="justify-center"
    @click.left.exact.prevent="handleBuyClick"
  />

  <UButton
    v-else
    v-bind="VTTG_SUBSCRIBE_BUTTON"
    class="justify-center"
  />
</template>
