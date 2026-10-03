<script setup lang="ts">
  import type {
    AreaChoiceFallback,
    AreaChoiceMode,
    AreaChoiceSettings,
    EffectAreaChoice,
    EffectTriggerAreaTarget,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    EFFECT_AREA_CHOICE_FALLBACK_OPTIONS,
    EFFECT_AREA_CHOICE_LABELS,
    EFFECT_AREA_CHOICE_MODE_OPTIONS,
    EFFECT_AREA_CHOICE_TARGET_OPTIONS,
    MAX_AREA_CHOICE_FORMULA_LENGTH,
    readAreaChoiceSettings,
    toDraftAreaChoice,
    toDraftAreaChoiceCount,
  } from '../../model';

  /**
   * «На выбор из тех, кто в области»: выбирает ли применивший цели среди
   * накрытых шаблоном, сколько, из кого и что делать без выбора. Значения по
   * умолчанию в данных не пишутся — правило из одних умолчаний снимается.
   */
  const areaChoice = defineModel<EffectAreaChoice | undefined>({
    required: true,
  });

  const settings = computed(() => readAreaChoiceSettings(areaChoice.value));

  /**
   * Меняет поля правила.
   *
   * @param patch изменённые поля.
   */
  function updateSettings(patch: Partial<AreaChoiceSettings>): void {
    areaChoice.value = toDraftAreaChoice({ ...settings.value, ...patch });
  }

  const mode = computed({
    get: () => settings.value.mode,
    set: (nextMode: AreaChoiceMode) => updateSettings({ mode: nextMode }),
  });

  // Число или формула одним полем: одни цифры пишутся числом
  const count = computed({
    get: () => String(settings.value.count ?? ''),
    set: (enteredCount: string) =>
      updateSettings({ count: toDraftAreaChoiceCount(enteredCount) }),
  });

  const target = computed({
    get: () => settings.value.target,
    set: (nextTarget: EffectTriggerAreaTarget) =>
      updateSettings({ target: nextTarget }),
  });

  const fallback = computed({
    get: () => settings.value.fallback,
    set: (nextFallback: AreaChoiceFallback) =>
      updateSettings({ fallback: nextFallback }),
  });

  /** Число и исход закрытого окна — только когда применивший выбирает. */
  const asksCaster = computed(() => settings.value.mode !== 'all');

  /** Без выбора правило только отсеивает: подпись отбора — про область. */
  const targetLabel = computed(() =>
    asksCaster.value
      ? EFFECT_AREA_CHOICE_LABELS.target
      : EFFECT_AREA_CHOICE_LABELS.targetWithoutChoice,
  );
</script>

<template>
  <div class="flex flex-wrap items-end gap-2">
    <UFormField class="w-full sm:w-72">
      <template #label>
        <InfoTooltip
          :text="EFFECT_AREA_CHOICE_LABELS.modeHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ EFFECT_AREA_CHOICE_LABELS.mode }}</span>
        </InfoTooltip>
      </template>

      <USelect
        v-model="mode"
        :items="EFFECT_AREA_CHOICE_MODE_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="asksCaster"
      class="w-full sm:w-96"
    >
      <template #label>
        <InfoTooltip
          :text="EFFECT_AREA_CHOICE_LABELS.countHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ EFFECT_AREA_CHOICE_LABELS.count }}</span>
        </InfoTooltip>
      </template>

      <UInput
        v-model="count"
        :placeholder="EFFECT_AREA_CHOICE_LABELS.countPlaceholder"
        :maxlength="MAX_AREA_CHOICE_FORMULA_LENGTH"
        size="sm"
        class="w-full font-mono"
      />
    </UFormField>

    <UFormField class="w-full sm:w-72">
      <template #label>
        <InfoTooltip
          :text="EFFECT_AREA_CHOICE_LABELS.targetHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ targetLabel }}</span>
        </InfoTooltip>
      </template>

      <USelect
        v-model="target"
        :items="EFFECT_AREA_CHOICE_TARGET_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="asksCaster"
      class="w-full sm:w-72"
    >
      <template #label>
        <InfoTooltip
          :text="EFFECT_AREA_CHOICE_LABELS.fallbackHint"
          icon="tabler:info-circle-filled"
        >
          <span>{{ EFFECT_AREA_CHOICE_LABELS.fallback }}</span>
        </InfoTooltip>
      </template>

      <USelect
        v-model="fallback"
        :items="EFFECT_AREA_CHOICE_FALLBACK_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
