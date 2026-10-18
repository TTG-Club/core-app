<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import {
    useSubscriptionPaymentTerms,
    useSubscriptionSales,
  } from '../composables';
  import {
    VTTG_SUBSCRIBE_BUTTON,
    VTTG_SUBSCRIPTION_BUY_BUTTON,
  } from '../model';
  import VttgSubscriptionPurchaseModal from './VttgSubscriptionPurchaseModal.vue';

  const { soon = VTTG_SUBSCRIBE_BUTTON } = defineProps<{
    /** Вид выключенной кнопки «скоро», пока оплата выключена в админке. */
    soon?: ButtonProps;
  }>();

  // Оплату можно выключить переключателем в админке — тогда у всех кнопка «скоро».
  const { isSalesEnabled, checkSalesEnabled } = useSubscriptionSales();

  const overlay = useOverlay();
  const purchaseModal = overlay.create(VttgSubscriptionPurchaseModal);

  // Оплату выключили, пока окно покупки открыто, — закрываем его.
  watch(isSalesEnabled, (isEnabled) => {
    if (!isEnabled) {
      purchaseModal.close();
    }
  });

  const { isLoading: isTermsLoading, load: loadTerms } =
    useSubscriptionPaymentTerms();

  /**
   * Открывает окно покупки, когда условия оплаты уже загружены: так окно
   * появляется сразу с ценой, без мигания загрузки.
   */
  async function handleBuyClick() {
    if (isTermsLoading.value) {
      return;
    }

    // Оплату могли выключить, пока страница была открыта: тогда кнопка сама
    // станет «скоро», а окно покупки не откроется.
    const [isEnabled, terms] = await Promise.all([
      checkSalesEnabled(),
      loadTerms(),
    ]);

    if (!isEnabled) {
      return;
    }

    if (terms) {
      purchaseModal.open({ terms });
    }
  }
</script>

<template>
  <UButton
    v-if="isSalesEnabled"
    v-bind="VTTG_SUBSCRIPTION_BUY_BUTTON"
    :loading="isTermsLoading"
    class="justify-center"
    @click.left.exact.prevent="handleBuyClick"
  />

  <UButton
    v-else
    v-bind="soon"
    class="justify-center"
  />
</template>
