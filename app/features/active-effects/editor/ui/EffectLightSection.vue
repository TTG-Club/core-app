<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectLight,
    EffectLightAnimation,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    DEFAULT_EFFECT_LIGHT,
    DEFAULT_EFFECT_LIGHT_COLOR,
    EFFECT_LIGHT_ANIMATION_OPTIONS,
    EFFECT_LIGHT_FEET_STEP,
    EFFECT_LIGHT_LABELS,
    EFFECT_LIGHT_STEADY_ANIMATION,
    MAX_EFFECT_LIGHT_FEET,
    MIN_EFFECT_LIGHT_FEET,
    toStoredEffectLightAnimation,
    toStoredEffectLightColor,
  } from '../../model';

  /**
   * Раздел «Свет»: пока эффект действует, носитель излучает свет — яркий и
   * тусклый «ещё на». Итог носителя (сильнейший свет) считает VTTG. Белый цвет
   * и ровный свет в данных не пишутся — это значения по умолчанию.
   */
  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /**
   * Правит свет эффекта.
   *
   * @param patch что меняется.
   */
  function updateLight(patch: Partial<EffectLight>): void {
    const { light } = effect.value;

    if (light) {
      effect.value = { ...effect.value, light: { ...light, ...patch } };
    }
  }

  const hasLight = computed({
    get: () => effect.value.light !== undefined,
    set: (enabled: boolean) => {
      effect.value = {
        ...effect.value,
        light: enabled ? { ...DEFAULT_EFFECT_LIGHT } : undefined,
      };
    },
  });

  // Очищенное поле числа отдаёт `undefined` — это «нет света» этого вида
  const brightFeet = computed({
    get: () => effect.value.light?.bright,
    set: (enteredFeet: number | null | undefined) =>
      updateLight({ bright: enteredFeet ?? MIN_EFFECT_LIGHT_FEET }),
  });

  const dimFeet = computed({
    get: () => effect.value.light?.dim,
    set: (enteredFeet: number | null | undefined) =>
      updateLight({ dim: enteredFeet ?? MIN_EFFECT_LIGHT_FEET }),
  });

  const lightColor = computed({
    get: () => effect.value.light?.color ?? DEFAULT_EFFECT_LIGHT_COLOR,
    set: (pickedColor: string | undefined) =>
      updateLight({ color: toStoredEffectLightColor(pickedColor) }),
  });

  const lightAnimation = computed({
    get: () => effect.value.light?.animation ?? EFFECT_LIGHT_STEADY_ANIMATION,
    set: (pickedAnimation: EffectLightAnimation) =>
      updateLight({ animation: toStoredEffectLightAnimation(pickedAnimation) }),
  });

  const swatchStyle = computed(() => ({ backgroundColor: lightColor.value }));
</script>

<template>
  <div class="flex flex-col gap-2">
    <USwitch
      v-model="hasLight"
      :label="EFFECT_LIGHT_LABELS.toggle"
      :description="EFFECT_LIGHT_LABELS.toggleHint"
    />

    <template v-if="effect.light">
      <div class="flex flex-wrap items-end gap-3">
        <UFormField
          :label="EFFECT_LIGHT_LABELS.bright"
          class="w-28"
        >
          <UInputNumber
            v-model="brightFeet"
            :min="MIN_EFFECT_LIGHT_FEET"
            :max="MAX_EFFECT_LIGHT_FEET"
            :step="EFFECT_LIGHT_FEET_STEP"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <!-- Подсказка под значком: строкой рядом она ломала ряд полей -->
        <UFormField class="w-36">
          <template #label>
            <InfoTooltip
              :text="EFFECT_LIGHT_LABELS.dimHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ EFFECT_LIGHT_LABELS.dim }}</span>
            </InfoTooltip>
          </template>

          <UInputNumber
            v-model="dimFeet"
            :min="MIN_EFFECT_LIGHT_FEET"
            :max="MAX_EFFECT_LIGHT_FEET"
            :step="EFFECT_LIGHT_FEET_STEP"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="EFFECT_LIGHT_LABELS.color">
          <UPopover>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              :label="lightColor"
            >
              <template #leading>
                <span
                  class="size-4 rounded-sm border border-default"
                  :style="swatchStyle"
                />
              </template>
            </UButton>

            <template #content>
              <UColorPicker
                v-model="lightColor"
                size="sm"
                class="p-2"
              />
            </template>
          </UPopover>
        </UFormField>

        <UFormField
          :label="EFFECT_LIGHT_LABELS.animation"
          class="w-40"
        >
          <USelect
            v-model="lightAnimation"
            :items="EFFECT_LIGHT_ANIMATION_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
          />
        </UFormField>
      </div>

      <p class="text-xs text-muted">
        {{ EFFECT_LIGHT_LABELS.sceneHint }}
      </p>
    </template>
  </div>
</template>
