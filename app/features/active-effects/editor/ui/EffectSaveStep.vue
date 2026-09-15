<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectAbility,
    EffectFormLayout,
    EffectSave,
    EffectSuccessOutcome,
  } from '../../model';

  import {
    ACTIVE_EFFECT_FORM_LABELS,
    buildSuccessOutcomeOptions,
    DEFAULT_EFFECT_SAVE_ABILITY,
    EFFECT_ABILITY_OPTIONS,
    EFFECT_ACTION_SAVE_SUCCESS_TITLES,
    EFFECT_SAVE_STEP_LABELS,
    EFFECT_SAVE_UNAVAILABLE_HINTS,
    EFFECT_SOURCE_DC_LABELS,
    layoutAcceptsSourceSaveDc,
    readEffectSuccessOutcome,
    writeEffectSaveEnabled,
    writeEffectSuccessOutcome,
  } from '../../model';
  import EffectSaveDcField from './EffectSaveDcField.vue';

  /**
   * Шаг «Спасбросок»: нужен ли спасбросок, какой и что даёт успех. Там, где
   * спасброска быть не может, шаг объясняет, как его получить.
   */
  const { layout, sourceSaveDc = undefined } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    sourceSaveDc?: number;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** Заголовок выбора «при успехе» спасброска заклинания или действия. */
  const actionSaveSuccessTitle = computed(
    () => EFFECT_ACTION_SAVE_SUCCESS_TITLES[layout.context],
  );

  /**
   * Эффект на цели заклинания или действия: у них свой спасбросок, и
   * спасбросок эффекта — дополнительный.
   */
  const isActionTarget = computed(
    () =>
      layout.delivery === 'target'
      && actionSaveSuccessTitle.value !== undefined,
  );

  const toggleLabel = computed(() => {
    if (isActionTarget.value) {
      return EFFECT_SAVE_STEP_LABELS.ownToggle;
    }

    // У зоны и ауры бросает не цель атаки, а вошедший или вышедший
    return layout.showTrigger
      ? EFFECT_SAVE_STEP_LABELS.areaToggle
      : EFFECT_SAVE_STEP_LABELS.toggle;
  });

  const toggleHint = computed(() =>
    isActionTarget.value
      ? EFFECT_SAVE_STEP_LABELS.ownToggleHint
      : EFFECT_SAVE_STEP_LABELS.toggleHint,
  );

  const successTitle = computed(() =>
    layout.successOutcomeForActionSave
      ? (actionSaveSuccessTitle.value ?? EFFECT_SAVE_STEP_LABELS.successTitle)
      : EFFECT_SAVE_STEP_LABELS.successTitle,
  );

  const successOptions = computed(() => buildSuccessOutcomeOptions(layout));

  /** Выбирать есть из чего: единственный вариант «ничего» не показывается. */
  const showSuccessChoice = computed(() => successOptions.value.length > 1);

  const unavailableHint = computed(() =>
    layout.saveUnavailableReason
      ? EFFECT_SAVE_UNAVAILABLE_HINTS[layout.saveUnavailableReason]
      : '',
  );

  const sourceDcLabel = computed(() => EFFECT_SOURCE_DC_LABELS[layout.context]);

  const hasSave = computed({
    get: () => effect.value.applySave !== undefined,
    set: (enabled: boolean) => {
      effect.value = writeEffectSaveEnabled(effect.value, enabled, layout);
    },
  });

  /**
   * Меняет поле спасброска.
   *
   * @param patch изменённые поля.
   */
  function updateSave(patch: Partial<EffectSave>): void {
    const { applySave } = effect.value;

    if (applySave) {
      effect.value = {
        ...effect.value,
        applySave: { ...applySave, ...patch },
      };
    }
  }

  const acceptsSourceSaveDc = computed(() => layoutAcceptsSourceSaveDc(layout));

  const saveAbility = computed({
    get: () => effect.value.applySave?.ability ?? DEFAULT_EFFECT_SAVE_ABILITY,
    set: (ability: EffectAbility) => updateSave({ ability }),
  });

  const saveDc = computed({
    get: () => effect.value.applySave?.dc ?? layout.minSaveDc,
    set: (dc: number) => updateSave({ dc }),
  });

  const successOutcome = computed({
    get: () => readEffectSuccessOutcome(effect.value),
    set: (outcome: EffectSuccessOutcome) => {
      effect.value = writeEffectSuccessOutcome(effect.value, outcome);
    },
  });
</script>

<template>
  <template v-if="layout.showSave">
    <USwitch
      v-model="hasSave"
      :label="toggleLabel"
      :description="toggleHint"
    />

    <div
      v-if="effect.applySave"
      class="flex flex-wrap items-end gap-3"
    >
      <UFormField
        :label="ACTIVE_EFFECT_FORM_LABELS.ability"
        class="w-48"
      >
        <USelect
          v-model="saveAbility"
          :items="EFFECT_ABILITY_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <EffectSaveDcField
        v-model="saveDc"
        :label="ACTIVE_EFFECT_FORM_LABELS.saveDc"
        :auto-allowed="acceptsSourceSaveDc"
        :auto-label="sourceDcLabel"
        :auto-value="sourceSaveDc"
      />
    </div>
  </template>

  <p
    v-else-if="unavailableHint"
    class="text-xs text-muted"
  >
    {{ unavailableHint }}
  </p>

  <div
    v-if="showSuccessChoice"
    class="flex flex-col gap-1.5"
  >
    <span class="text-xs font-medium text-muted">
      {{ successTitle }}
    </span>

    <URadioGroup
      v-model="successOutcome"
      :items="successOptions"
      value-key="value"
      variant="card"
      size="sm"
      :ui="{ fieldset: 'grid grid-cols-1 gap-2 sm:grid-cols-2' }"
    />
  </div>
</template>
