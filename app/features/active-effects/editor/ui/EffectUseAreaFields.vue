<script setup lang="ts">
  import type {
    EffectSegmentOption,
    EffectUseArea,
    EffectUseAreaChoice,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    DEFAULT_USE_AREA_SIZE,
    EFFECT_ACTIVATION_EXTRA_LABELS,
    MAX_EFFECT_USE_AREA_SIZE,
    MIN_EFFECT_USE_AREA_SIZE,
    NO_USE_AREA,
    useAreaHasWidth,
  } from '../../model';

  /**
   * Шаблон области на карте: форма, размер и — у линии — ширина. Одни и те же
   * поля у области применения эффекта и у получателей кнопки «При действии»:
   * различаются подписью и первым пунктом выбора («одна цель» либо «радиус от
   * носителя»).
   */
  defineProps<{
    /** Подпись выбора формы. */
    label: string;
    /** Пояснение к выбору формы. */
    hint: string;
    /** Формы в выборе; первым — пункт «без шаблона». */
    items: Array<EffectSegmentOption<EffectUseAreaChoice>>;
  }>();

  /** Шаблон; нет — области нет. */
  const area = defineModel<EffectUseArea | undefined>({ required: true });

  // Новая область появляется с размером по умолчанию; ширина остаётся только
  // у линии
  const areaShape = computed<EffectUseAreaChoice>({
    get: () => area.value?.shape ?? NO_USE_AREA,
    set: (nextShape) => {
      area.value =
        nextShape === NO_USE_AREA
          ? undefined
          : {
              shape: nextShape,
              size: area.value?.size ?? DEFAULT_USE_AREA_SIZE,
              width: useAreaHasWidth(nextShape) ? area.value?.width : undefined,
            };
    },
  });

  // Очищенное поле числа отдаёт `undefined`: размер остаётся прежним
  const areaSize = computed({
    get: () => area.value?.size ?? DEFAULT_USE_AREA_SIZE,
    set: (enteredSize: number | null | undefined) => {
      if (area.value && typeof enteredSize === 'number') {
        area.value = { ...area.value, size: enteredSize };
      }
    },
  });

  // Пустая ширина в данных не пишется
  const areaWidth = computed({
    get: () => area.value?.width,
    set: (enteredWidth: number | null | undefined) => {
      if (area.value) {
        area.value = { ...area.value, width: enteredWidth ?? undefined };
      }
    },
  });

  const hasWidth = computed(() => useAreaHasWidth(area.value?.shape));
</script>

<template>
  <UFormField class="w-full sm:w-52">
    <template #label>
      <InfoTooltip
        :text="hint"
        icon="tabler:info-circle-filled"
      >
        <span>{{ label }}</span>
      </InfoTooltip>
    </template>

    <USelect
      v-model="areaShape"
      :items="items"
      value-key="value"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <UFormField
    v-if="area"
    :label="EFFECT_ACTIVATION_EXTRA_LABELS.areaSize"
    class="w-full sm:w-32"
  >
    <UInputNumber
      v-model="areaSize"
      :min="MIN_EFFECT_USE_AREA_SIZE"
      :max="MAX_EFFECT_USE_AREA_SIZE"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <UFormField
    v-if="hasWidth"
    :label="EFFECT_ACTIVATION_EXTRA_LABELS.areaWidth"
    class="w-full sm:w-32"
  >
    <UInputNumber
      v-model="areaWidth"
      :min="MIN_EFFECT_USE_AREA_SIZE"
      :max="MAX_EFFECT_USE_AREA_SIZE"
      size="sm"
      class="w-full"
    />
  </UFormField>
</template>
