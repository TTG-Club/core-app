<script setup lang="ts">
  import { SUBSCRIPTION_SALES_ADMIN_API_PATH } from '#shared/consts';
  import { useSubscriptionSales } from '~vttg/composables';

  import { SUBSCRIPTION_SALES_CARD_TEXT } from '../model';

  const toast = useToast();
  const { isSalesEnabled, refresh } = useSubscriptionSales();

  const isSaving = ref(false);

  /**
   * Сохраняет новое состояние оплаты и перечитывает настройку — так кнопка
   * покупки на сайте в этой же вкладке сразу показывает новое состояние.
   */
  async function handleToggle(enabled: boolean): Promise<void> {
    isSaving.value = true;

    try {
      await $fetch(SUBSCRIPTION_SALES_ADMIN_API_PATH, {
        method: 'PUT',
        body: { enabled },
      });

      toast.add({
        title: enabled
          ? SUBSCRIPTION_SALES_CARD_TEXT.enabledToast
          : SUBSCRIPTION_SALES_CARD_TEXT.disabledToast,
        color: enabled ? 'success' : 'warning',
      });
    } catch {
      toast.add({
        title: SUBSCRIPTION_SALES_CARD_TEXT.errorToast,
        color: 'error',
      });
    } finally {
      await refresh();
      isSaving.value = false;
    }
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="truncate text-base text-highlighted">
          {{ SUBSCRIPTION_SALES_CARD_TEXT.title }}
        </h2>

        <USwitch
          :model-value="isSalesEnabled"
          :loading="isSaving"
          :disabled="isSaving"
          :label="SUBSCRIPTION_SALES_CARD_TEXT.switchLabel"
          @update:model-value="handleToggle"
        />
      </div>
    </template>

    <div class="text-sm text-muted">
      {{ SUBSCRIPTION_SALES_CARD_TEXT.description }}
    </div>
  </UCard>
</template>
