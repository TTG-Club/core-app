<script setup lang="ts">
  import { SUBSCRIPTION_SALES_ADMIN_API_PATH } from '#shared/consts';
  import { useSubscriptionSales } from '~vttg/composables';

  import {
    SUBSCRIPTION_SALES_SWITCH_DISABLED_STATE,
    SUBSCRIPTION_SALES_SWITCH_ENABLED_STATE,
    SUBSCRIPTION_SALES_SWITCH_TEXT,
  } from '../model';

  const toast = useToast();
  const { isSalesEnabled, refresh } = useSubscriptionSales();

  const isSaving = ref(false);

  const salesState = computed(() =>
    isSalesEnabled.value
      ? SUBSCRIPTION_SALES_SWITCH_ENABLED_STATE
      : SUBSCRIPTION_SALES_SWITCH_DISABLED_STATE,
  );

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
          ? SUBSCRIPTION_SALES_SWITCH_TEXT.enabledToast
          : SUBSCRIPTION_SALES_SWITCH_TEXT.disabledToast,
        color: enabled ? 'success' : 'warning',
      });
    } catch {
      toast.add({
        title: SUBSCRIPTION_SALES_SWITCH_TEXT.errorToast,
        color: 'error',
      });
    } finally {
      await refresh();
      isSaving.value = false;
    }
  }
</script>

<template>
  <section
    class="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
    :class="salesState.rootClass"
  >
    <span
      class="flex size-9 shrink-0 items-center justify-center rounded-full"
      :class="salesState.iconClass"
    >
      <UIcon
        :name="salesState.icon"
        class="size-5"
      />
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-sm font-semibold text-highlighted">
          {{ SUBSCRIPTION_SALES_SWITCH_TEXT.title }}
        </h2>

        <UBadge
          :color="salesState.color"
          variant="subtle"
          size="sm"
        >
          {{ salesState.status }}
        </UBadge>
      </div>

      <p class="mt-0.5 text-xs text-muted">{{ salesState.description }}</p>
    </div>

    <USwitch
      :model-value="isSalesEnabled"
      :color="salesState.color"
      :loading="isSaving"
      :disabled="isSaving"
      :aria-label="SUBSCRIPTION_SALES_SWITCH_TEXT.switchLabel"
      size="lg"
      @update:model-value="handleToggle"
    />
  </section>
</template>
