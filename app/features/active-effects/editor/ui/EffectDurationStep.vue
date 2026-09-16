<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectDurationType,
    EffectTurnAnchor,
    EffectTurnTiming,
  } from '../../model';

  import {
    DEFAULT_EFFECT_TURN_ANCHOR,
    DEFAULT_EFFECT_TURN_TIMING,
    durationHint,
    EFFECT_DURATION_STEP_LABELS,
    EFFECT_DURATION_TYPE_OPTIONS,
    EFFECT_TURN_ANCHOR_OPTIONS,
    EFFECT_TURN_DURATION_TYPE,
    EFFECT_TURN_TIMING_OPTIONS,
    isCountedDuration,
    MIN_EFFECT_DURATION_VALUE,
    writeDurationType,
  } from '../../model';

  /**
   * Шаг «Длительность»: сколько держится эффект. Повторный спасбросок и снятие
   * после атаки — строки списка «Срабатывания».
   */
  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const durationType = computed({
    get: () => effect.value.duration.type,
    set: (type: EffectDurationType) => {
      effect.value = {
        ...effect.value,
        duration: writeDurationType(effect.value.duration, type),
      };
    },
  });

  const hasDurationValue = computed(() =>
    isCountedDuration(effect.value.duration.type),
  );

  const isTurnDuration = computed(
    () => effect.value.duration.type === EFFECT_TURN_DURATION_TYPE,
  );

  const durationDescription = computed(() =>
    durationHint(effect.value.duration.type),
  );

  const durationValue = computed({
    get: () => effect.value.duration.value ?? null,
    set: (durationAmount: number | null) => {
      effect.value = {
        ...effect.value,
        duration: {
          ...effect.value.duration,
          value: durationAmount ?? undefined,
        },
      };
    },
  });

  const turnTiming = computed({
    get: () => effect.value.duration.turnTiming ?? DEFAULT_EFFECT_TURN_TIMING,
    set: (timing: EffectTurnTiming) => {
      effect.value = {
        ...effect.value,
        duration: { ...effect.value.duration, turnTiming: timing },
      };
    },
  });

  const turnAnchor = computed({
    get: () => effect.value.duration.turnAnchor ?? DEFAULT_EFFECT_TURN_ANCHOR,
    set: (anchor: EffectTurnAnchor) => {
      effect.value = {
        ...effect.value,
        duration: { ...effect.value.duration, turnAnchor: anchor },
      };
    },
  });
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs font-medium text-default">
      {{ EFFECT_DURATION_STEP_LABELS.durationTitle }}
    </span>

    <div class="flex flex-wrap items-center gap-2">
      <USelect
        v-model="durationType"
        :items="EFFECT_DURATION_TYPE_OPTIONS"
        value-key="value"
        size="sm"
        class="w-48"
      />

      <UInputNumber
        v-if="hasDurationValue"
        v-model="durationValue"
        :min="MIN_EFFECT_DURATION_VALUE"
        :placeholder="EFFECT_DURATION_STEP_LABELS.valuePlaceholder"
        size="sm"
        class="w-28"
      />

      <template v-if="isTurnDuration">
        <USelect
          v-model="turnTiming"
          :items="EFFECT_TURN_TIMING_OPTIONS"
          value-key="value"
          size="sm"
          class="w-40"
        />

        <USelect
          v-model="turnAnchor"
          :items="EFFECT_TURN_ANCHOR_OPTIONS"
          value-key="value"
          size="sm"
          class="w-48"
        />
      </template>
    </div>

    <p class="text-xs text-muted">
      {{ durationDescription }}
    </p>
  </div>
</template>
