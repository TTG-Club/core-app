<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectEscape,
    EffectFormLayout,
  } from '../../model';

  import {
    createDefaultEscape,
    EFFECT_APPLIER_DC_LABELS,
    EFFECT_ESCAPE_SECTION_LABELS,
    layoutAcceptsApplierSaveDc,
  } from '../../model';
  import EffectEscapeFields from './EffectEscapeFields.vue';

  /**
   * Раздел «Действие, снимающее эффект»: «существо может действием совершить
   * проверку Силы (Атлетика) Сл 14 и освободиться». На листе VTTG у такого
   * эффекта появляется кнопка.
   *
   * Сл «Авто» — Сл источника: её проставляют при наложении. У эффекта без
   * источника она остаётся нулевой, и кнопка честно отказывается действовать —
   * поэтому «Авто» есть только там, где источник бывает.
   */
  const { layout, applierSaveDc = undefined } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** «Авто» доступно там, где Сл источника вообще бывает. */
  const autoDcAllowed = computed(() => layoutAcceptsApplierSaveDc(layout));

  const applierDcLabel = computed(
    () => EFFECT_APPLIER_DC_LABELS[layout.context],
  );

  // Новый блок — действием и с проверкой: так правила пишут чаще всего
  const hasEscape = computed({
    get: () => effect.value.escape !== undefined,
    set: (enabled: boolean) => {
      effect.value = {
        ...effect.value,
        escape: enabled ? createDefaultEscape(autoDcAllowed.value) : undefined,
      };
    },
  });

  /**
   * Записывает блок действия.
   *
   * @param nextEscape блок действия.
   */
  function updateEscape(nextEscape: EffectEscape): void {
    effect.value = { ...effect.value, escape: nextEscape };
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <USwitch
      v-model="hasEscape"
      :label="EFFECT_ESCAPE_SECTION_LABELS.toggle"
      :description="EFFECT_ESCAPE_SECTION_LABELS.hint"
    />

    <EffectEscapeFields
      v-if="effect.escape"
      :model-value="effect.escape"
      :auto-dc-allowed="autoDcAllowed"
      :auto-label="applierDcLabel"
      :applier-save-dc="applierSaveDc"
      @update:model-value="updateEscape"
    />
  </div>
</template>
