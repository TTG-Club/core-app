<script setup lang="ts">
  import { SUBSCRIPTION_SALES_ADMIN_API_PATH } from '#shared/consts';
  import { ADMIN_DASHBOARD_TOOLTIP_UI } from '~admin/dashboard/model';
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
  <div
    class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors"
    :class="salesState.rootClass"
  >
    <UTooltip
      :text="salesState.description"
      :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
    >
      <div class="flex min-w-0 flex-1 items-center gap-1.5">
        <!--
          Ключ пересоздаёт значок при смене состояния: модуль иконок в CSS-режиме
          оставляет у живого элемента картинку прежнего имени.
        -->
        <UIcon
          :key="salesState.icon"
          :name="salesState.icon"
          class="size-5 shrink-0"
          :class="salesState.iconClass"
        />

        <span class="truncate text-sm font-medium text-default">
          {{ SUBSCRIPTION_SALES_SWITCH_TEXT.title }}
        </span>
      </div>
    </UTooltip>

    <UBadge
      :color="salesState.color"
      variant="subtle"
      size="sm"
    >
      {{ salesState.status }}
    </UBadge>

    <USwitch
      :model-value="isSalesEnabled"
      :color="salesState.color"
      :loading="isSaving"
      :disabled="isSaving"
      :aria-label="SUBSCRIPTION_SALES_SWITCH_TEXT.switchLabel"
      size="sm"
      @update:model-value="handleToggle"
    />
  </div>
</template>
