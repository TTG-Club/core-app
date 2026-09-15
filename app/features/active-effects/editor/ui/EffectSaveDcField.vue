<script setup lang="ts">
  import type { SaveDcFieldMode } from '../../model';

  import {
    DEFAULT_EFFECT_SAVE_DC,
    SAVE_DC_AUTO_SEPARATOR,
    SAVE_DC_FIELD_MODE_OPTIONS,
    SOURCE_SAVE_DC,
  } from '../../model';

  /**
   * Поле Сл спасброска. Где у Сл есть источник (заклинатель, действие,
   * оружие), выбирается «Авто» — Сл источника, в данных это 0 — или «Вручную»
   * со своим числом. Где источника нет, остаётся только число.
   */
  const {
    autoAllowed,
    autoLabel = '',
    autoValue = undefined,
  } = defineProps<{
    /** Подпись поля. */
    label: string;
    /** Можно ли «Авто»: у Сл есть источник. */
    autoAllowed: boolean;
    /** Чья Сл подставляется в «Авто» («Сл заклинателя»). */
    autoLabel?: string;
    /** Сл источника, если форма её знает (Сл действия существа). */
    autoValue?: number;
  }>();

  /** Сл: `SOURCE_SAVE_DC` — «Авто». */
  const dc = defineModel<number>({ required: true });

  const mode = computed<SaveDcFieldMode>({
    get: () => (autoAllowed && dc.value === SOURCE_SAVE_DC ? 'auto' : 'manual'),
    set: (nextMode) => {
      if (nextMode === 'auto') {
        dc.value = SOURCE_SAVE_DC;

        return;
      }

      // Своё число начинается с того, что сейчас дал бы источник
      if (dc.value === SOURCE_SAVE_DC) {
        dc.value = autoValue ?? DEFAULT_EFFECT_SAVE_DC;
      }
    },
  });

  const isAuto = computed(() => mode.value === 'auto');

  const manualDc = computed({
    get: () => dc.value,
    set: (value: number | null) => {
      if (value !== null) {
        dc.value = value;
      }
    },
  });

  /** Что подставится в «Авто»: чья Сл и её число, если известно. */
  const autoText = computed(() =>
    autoValue === undefined
      ? autoLabel
      : `${autoLabel}${SAVE_DC_AUTO_SEPARATOR}${autoValue}`,
  );
</script>

<template>
  <UFormField
    :label="label"
    class="min-w-56"
  >
    <div class="flex items-center gap-2">
      <USelect
        v-if="autoAllowed"
        v-model="mode"
        :items="SAVE_DC_FIELD_MODE_OPTIONS"
        value-key="value"
        size="sm"
        class="w-28"
      />

      <span
        v-if="isAuto"
        class="text-sm text-muted"
      >
        {{ autoText }}
      </span>

      <UInputNumber
        v-else
        v-model="manualDc"
        :min="1"
        size="sm"
        class="w-28"
      />
    </div>
  </UFormField>
</template>
