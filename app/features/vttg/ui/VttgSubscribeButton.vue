<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import {
    VTTG_SUBSCRIBE_BUTTON,
    VTTG_SUBSCRIPTION_BUY_BUTTON,
  } from '../model';
  import VttgSubscriptionPurchaseModal from './VttgSubscriptionPurchaseModal.vue';

  const { soon = VTTG_SUBSCRIBE_BUTTON } = defineProps<{
    /** Вид выключенной кнопки «скоро» для тех, кому покупка недоступна. */
    soon?: ButtonProps;
  }>();

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
    v-bind="soon"
    class="justify-center"
  />
</template>
