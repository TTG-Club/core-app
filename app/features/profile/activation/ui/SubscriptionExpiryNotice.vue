<script setup lang="ts">
  import { useExpiringSubscription } from '../composables';
  import {
    formatSubscriptionExpiryDescription,
    REDEMPTION_DATE_FORMAT,
    SUBSCRIPTION_EXPIRY_ACTIONS,
    SUBSCRIPTION_EXPIRY_NOTICE,
  } from '../model';

  const { format } = useDayjs();

  const { expiringSubscription, dismiss } = useExpiringSubscription();

  const expiryDescription = computed(() =>
    expiringSubscription.value
      ? formatSubscriptionExpiryDescription(
          format(expiringSubscription.value.expiresAt, REDEMPTION_DATE_FORMAT),
          expiringSubscription.value.daysLeft,
        )
      : undefined,
  );

  /** Закрытие крестиком скрывает напоминание до конца суток. */
  function handleOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      dismiss();
    }
  }
</script>

<!--
  Плавающая карточка, а не полоса вверху страницы: полоса сдвигала бы разделы,
  растянутые на высоту экрана. Справа снизу, над кнопкой кубиков; на телефоне —
  сверху, чтобы не спорить с нижней панелью и уведомлением о cookie.
-->
<template>
  <Transition name="slide-up">
    <UAlert
      v-if="expiryDescription"
      role="region"
      :aria-label="SUBSCRIPTION_EXPIRY_NOTICE.title"
      :title="SUBSCRIPTION_EXPIRY_NOTICE.title"
      :description="expiryDescription"
      :icon="SUBSCRIPTION_EXPIRY_NOTICE.icon"
      :actions="SUBSCRIPTION_EXPIRY_ACTIONS"
      close
      color="warning"
      variant="outline"
      class="fixed inset-x-3 top-3 z-90 bg-default shadow-2xl md:inset-x-auto md:top-auto md:right-4 md:bottom-20 md:max-w-md"
      @update:open="handleOpenChange"
    />
  </Transition>
</template>
