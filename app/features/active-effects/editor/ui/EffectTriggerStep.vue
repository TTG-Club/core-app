<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectAura,
    EffectAuraTarget,
    EffectFormLayout,
  } from '../../model';

  import {
    buildAreaTriggerOptions,
    buildDeliveryOptions,
    DEFAULT_EFFECT_AURA,
    EFFECT_AREA_TRIGGER_HINTS,
    EFFECT_AURA_LABELS,
    EFFECT_AURA_RADIUS_STEP,
    EFFECT_AURA_TARGET_OPTIONS,
    EFFECT_SCROLLABLE_TABS_UI,
    findAreaTrigger,
    MIN_EFFECT_AURA_RADIUS,
    resolveEffectDeliveryHint,
    writeEffectAreaTrigger,
    writeEffectDelivery,
  } from '../../model';

  /**
   * Шаг «Когда срабатывает»: на кого ложится эффект (носитель, цель, аура,
   * зона заклинания), момент срабатывания зоны или ауры и настройки ауры.
   */
  const { layout } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const deliveryOptions = computed(() => buildDeliveryOptions(layout));

  const triggerOptions = computed(() =>
    buildAreaTriggerOptions(layout.delivery),
  );

  /** Выбор доставки нужен, только если вариантов больше одного. */
  const showDeliveryChoice = computed(() => deliveryOptions.value.length > 1);

  /** Пояснение под выбором доставки: у зоны заклинания своё. */
  const deliveryHint = computed(() => resolveEffectDeliveryHint(layout));

  const triggerHint = computed(() => EFFECT_AREA_TRIGGER_HINTS[layout.trigger]);

  /** Настройки ауры видны у доставки «аурой», когда аура уже заведена. */
  const showAuraSettings = computed(
    () => layout.showAuraSettings && effect.value.aura !== undefined,
  );

  /**
   * Аура в полях настроек. Поля видны, только когда аура заведена, так что
   * аура по умолчанию лишь закрывает её отсутствие в типе.
   */
  const aura = computed(() => effect.value.aura ?? DEFAULT_EFFECT_AURA);

  /**
   * Меняет доставку эффекта.
   *
   * @param selectedDelivery значение переключателя.
   */
  function selectDelivery(selectedDelivery: string | number): void {
    const delivery = layout.deliveryOptions.find(
      (deliveryOption) => deliveryOption === selectedDelivery,
    );

    if (delivery) {
      effect.value = writeEffectDelivery(effect.value, delivery);
    }
  }

  /**
   * Меняет момент срабатывания зоны или ауры.
   *
   * @param selectedTrigger значение переключателя.
   */
  function selectTrigger(selectedTrigger: string | number): void {
    const trigger = findAreaTrigger(selectedTrigger);

    if (trigger) {
      effect.value = writeEffectAreaTrigger(effect.value, trigger);
    }
  }

  /**
   * Меняет поле ауры.
   *
   * @param patch изменённые поля.
   */
  function updateAura(patch: Partial<EffectAura>): void {
    const { aura: currentAura } = effect.value;

    if (currentAura) {
      effect.value = { ...effect.value, aura: { ...currentAura, ...patch } };
    }
  }

  const auraRadius = computed({
    get: () => aura.value.radius,
    set: (radius: number | null | undefined) => {
      // Очищенное поле числа отдаёт `undefined`, а не `null`
      if (typeof radius === 'number') {
        updateAura({ radius });
      }
    },
  });

  const auraTarget = computed({
    get: () => aura.value.target,
    set: (target: EffectAuraTarget) => updateAura({ target }),
  });

  const auraApplyToSelf = computed({
    get: () => aura.value.applyToSelf,
    set: (applyToSelf: boolean | 'indeterminate') =>
      updateAura({ applyToSelf: applyToSelf === true }),
  });

  // Круг в данных может быть не задан: тогда флажок снят, как и раньше
  const auraVisible = computed({
    get: () => aura.value.visible === true,
    set: (visible: boolean | 'indeterminate') =>
      updateAura({ visible: visible === true }),
  });
</script>

<template>
  <div
    v-if="showDeliveryChoice"
    class="flex flex-col gap-1.5"
  >
    <UTabs
      :model-value="layout.delivery"
      :items="deliveryOptions"
      :content="false"
      size="xs"
      color="primary"
      class="w-fit max-w-full"
      :ui="EFFECT_SCROLLABLE_TABS_UI"
      @update:model-value="selectDelivery"
    />

    <p class="text-xs text-muted">
      {{ deliveryHint }}
    </p>
  </div>

  <div
    v-if="layout.showTrigger"
    class="flex flex-col gap-1.5"
  >
    <UTabs
      :model-value="layout.trigger"
      :items="triggerOptions"
      :content="false"
      size="xs"
      color="primary"
      class="w-fit max-w-full"
      :ui="EFFECT_SCROLLABLE_TABS_UI"
      @update:model-value="selectTrigger"
    />

    <p class="text-xs text-muted">
      {{ triggerHint }}
    </p>
  </div>

  <div
    v-if="showAuraSettings"
    class="flex flex-wrap items-end gap-3 rounded-md border border-default bg-elevated/40 px-3 py-2"
  >
    <UFormField
      :label="EFFECT_AURA_LABELS.radius"
      class="w-32"
    >
      <UInputNumber
        v-model="auraRadius"
        :min="MIN_EFFECT_AURA_RADIUS"
        :step="EFFECT_AURA_RADIUS_STEP"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_AURA_LABELS.target"
      class="w-48"
    >
      <USelect
        v-model="auraTarget"
        :items="EFFECT_AURA_TARGET_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <div class="flex h-8 flex-wrap items-center gap-4">
      <UCheckbox
        v-model="auraApplyToSelf"
        :label="EFFECT_AURA_LABELS.applyToSelf"
      />

      <UCheckbox
        v-model="auraVisible"
        :label="EFFECT_AURA_LABELS.visible"
      />
    </div>
  </div>
</template>
