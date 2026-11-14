<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { AuthModal } from '~user/auth-modal';

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

  // Сессию решает кука токена, а не профиль: профиль догружается лениво, и
  // вошедший сразу после загрузки страницы увидел бы окно входа.
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const { isLoggedIn } = useUser();

  const hasSession = computed(() => isLoggedIn.value || Boolean(token.value));

  const isAuthOpen = ref(false);

  // Вход меняет куку токена, а её значение кэшируется с момента гидрации —
  // сбрасываем кэш. Окно входа закрылось уже с профилем — значит, гость вошёл
  // ради покупки: продолжаем её без второго нажатия. Цикла нет — покупка
  // вошедшего окно входа не открывает.
  watch(isAuthOpen, (isOpen) => {
    refreshCookie(USER_TOKEN_COOKIE);

    if (!isOpen && isLoggedIn.value) {
      void handleBuyClick();
    }
  });

  /**
   * Открывает окно покупки, когда условия оплаты уже загружены: так окно
   * появляется сразу с ценой, без мигания загрузки.
   */
  async function handleBuyClick() {
    if (isTermsLoading.value) {
      return;
    }

    // Условия оплаты сервис отдаёт только вошедшим: гостю вместо запроса,
    // который закончится отказом, открываем окно входа.
    if (!hasSession.value) {
      isAuthOpen.value = true;

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

  <AuthModal v-model="isAuthOpen" />
</template>
