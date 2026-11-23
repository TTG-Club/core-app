<script setup lang="ts">
  import type { ActiveEffect } from '../../model';

  import { ACTIVE_EFFECT_FORM_LABELS } from '../../model';

  /**
   * Шапка эффекта: название, иконка и работает ли эффект. Готовое состояние
   * выбирается в шаге «Что меняет», как в системе: из шапки его не находили.
   */
  defineProps<{
    /**
     * Показывать переключатель «Работает». У шаблона применения его нет: на
     * листе такой шаблон всегда лежит выключенным.
     */
    showStatusToggle: boolean;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const name = computed({
    get: () => effect.value.name,
    set: (nextName: string) => {
      effect.value = { ...effect.value, name: nextName };
    },
  });

  const icon = computed({
    get: () => effect.value.icon ?? '',
    set: (nextIcon: string) => {
      effect.value = { ...effect.value, icon: nextIcon || undefined };
    },
  });

  const isActive = computed({
    get: () => !effect.value.disabled,
    set: (enabled: boolean) => {
      effect.value = { ...effect.value, disabled: !enabled };
    },
  });

  /** Подпись переключателя «работает / отключён». */
  const statusLabel = computed(() =>
    isActive.value
      ? ACTIVE_EFFECT_FORM_LABELS.statusActive
      : ACTIVE_EFFECT_FORM_LABELS.statusDisabled,
  );

  /** Иконка в поле иконки: пустое поле — без иконки. */
  const iconPreview = computed(() => icon.value || undefined);
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <UFormField
      :label="ACTIVE_EFFECT_FORM_LABELS.name"
      class="min-w-48 flex-1"
    >
      <UInput
        v-model="name"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="ACTIVE_EFFECT_FORM_LABELS.icon"
      class="w-56"
    >
      <UInput
        v-model="icon"
        :icon="iconPreview"
        :placeholder="ACTIVE_EFFECT_FORM_LABELS.iconPlaceholder"
        class="w-full"
      />
    </UFormField>

    <USwitch
      v-if="showStatusToggle"
      v-model="isActive"
      :label="statusLabel"
      class="h-8 items-center"
    />
  </div>
</template>
