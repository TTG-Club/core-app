<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectAura,
    EffectAuraTarget,
    EffectFormLayout,
  } from '../../model';

  import {
    buildDeliveryOptions,
    buildTriggerOptions,
    EFFECT_AURA_LABELS,
    EFFECT_AURA_RADIUS_STEP,
    EFFECT_AURA_TARGET_OPTIONS,
    EFFECT_DELIVERY_HINTS,
    EFFECT_SPELL_ZONE_DELIVERY_HINT,
    EFFECT_TRIGGER_HINTS,
    findTrigger,
    writeEffectDelivery,
    writeEffectTrigger,
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

  /**
   * Лента вариантов прокручивается по горизонтали: у заклинания их четыре, и
   * на телефоне сжатые вкладки обрезали подписи до пары букв.
   */
  const TAB_LIST_CLASS =
    'max-w-full overflow-x-auto overscroll-x-contain hidden-scrollbar';

  /** Вкладка не ужимается под ширину ленты — подпись видна целиком. */
  const TAB_TRIGGER_CLASS = 'shrink-0';

  const deliveryOptions = computed(() => buildDeliveryOptions(layout));

  const triggerOptions = computed(() => buildTriggerOptions(layout.delivery));

  /** Выбор доставки нужен, только если вариантов больше одного. */
  const showDeliveryChoice = computed(() => deliveryOptions.value.length > 1);

  /** Пояснение под выбором доставки: у зоны заклинания своё. */
  const deliveryHint = computed(() =>
    layout.delivery === 'zone' && layout.context === 'spell'
      ? EFFECT_SPELL_ZONE_DELIVERY_HINT
      : EFFECT_DELIVERY_HINTS[layout.delivery],
  );

  const triggerHint = computed(() => EFFECT_TRIGGER_HINTS[layout.trigger]);

  /** Настройки ауры видны у доставки «аурой», когда аура уже заведена. */
  const showAuraSettings = computed(
    () => layout.showAuraSettings && effect.value.aura !== undefined,
  );

  /**
   * Меняет доставку эффекта.
   *
   * @param value значение переключателя.
   */
  function selectDelivery(value: string | number): void {
    const delivery = layout.deliveryOptions.find((option) => option === value);

    if (delivery) {
      effect.value = writeEffectDelivery(effect.value, delivery);
    }
  }

  /**
   * Меняет момент срабатывания зоны или ауры.
   *
   * @param value значение переключателя.
   */
  function selectTrigger(value: string | number): void {
    const trigger = findTrigger(value);

    if (trigger) {
      effect.value = writeEffectTrigger(effect.value, trigger);
    }
  }

  /**
   * Меняет поле ауры.
   *
   * @param patch изменённые поля.
   */
  function updateAura(patch: Partial<EffectAura>): void {
    const { aura } = effect.value;

    if (aura) {
      effect.value = { ...effect.value, aura: { ...aura, ...patch } };
    }
  }

  const auraRadius = computed({
    get: () => effect.value.aura?.radius ?? 0,
    set: (radius: number | null) => {
      if (radius !== null) {
        updateAura({ radius });
      }
    },
  });

  const auraTarget = computed({
    get: () => effect.value.aura?.target ?? 'allies',
    set: (target: EffectAuraTarget) => updateAura({ target }),
  });

  const auraApplyToSelf = computed({
    get: () => effect.value.aura?.applyToSelf ?? false,
    set: (applyToSelf: boolean | 'indeterminate') =>
      updateAura({ applyToSelf: applyToSelf === true }),
  });

  const auraVisible = computed({
    get: () => effect.value.aura?.visible ?? false,
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
      :ui="{ list: TAB_LIST_CLASS, trigger: TAB_TRIGGER_CLASS }"
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
      :ui="{ list: TAB_LIST_CLASS, trigger: TAB_TRIGGER_CLASS }"
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
        :min="0"
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
