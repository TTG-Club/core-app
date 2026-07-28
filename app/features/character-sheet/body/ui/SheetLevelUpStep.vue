<script setup lang="ts">
  import type {
    ClassChoice,
    HitPointsGainMode,
    LevelUpStepDraft,
    LevelUpStepView,
  } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    getFormattedBonus,
    getHitDieAverage,
    getHitDieLabel,
    getLevelHitPointsGain,
    HIT_POINTS_GAIN_MODE_LABELS,
    isHitPointsGainMode,
    LEVEL_UP_HIT_POINTS_LABELS,
    LEVEL_UP_WIZARD_LABELS,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';

  const { step, draft, hitDie, constitutionModifier, choiceOptions } =
    defineProps<{
      /** Шаг мастера: уровень, его умения и прирост хитов. */
      step: LevelUpStepView;

      /** Черновик шага: выбранный способ прироста, бросок и выборы игрока. */
      draft: LevelUpStepDraft;

      /** Номинал кости хитов класса; 0 — класс неизвестен. */
      hitDie: number;

      constitutionModifier: number;

      /** Опции пикера для выбора внутри умения. */
      choiceOptions: (choice: ClassChoice) => string[];
    }>();

  const emit = defineEmits<{
    'update:gain-mode': [mode: HitPointsGainMode];
    'roll': [];
    'update:selection': [choiceId: string, values: string[]];
    'update:note': [featureId: string, value: string];
  }>();

  const formattedConstitutionModifier = computed(() =>
    getFormattedBonus(constitutionModifier),
  );

  const isHitPointsVisible = computed(() => hitDie > 0);

  const hitDieLabel = computed(() => getHitDieLabel(hitDie));

  const averageGain = computed(() =>
    getLevelHitPointsGain(getHitDieAverage(hitDie), constitutionModifier),
  );

  const maxGain = computed(() =>
    getLevelHitPointsGain(hitDie, constitutionModifier),
  );

  const gainModeOptions = computed(() => [
    {
      value: 'average',
      label: HIT_POINTS_GAIN_MODE_LABELS.average,
      description: `+${averageGain.value} ${LEVEL_UP_HIT_POINTS_LABELS.hitPointsPerLevelSuffix}`,
    },
    {
      value: 'max',
      label: HIT_POINTS_GAIN_MODE_LABELS.max,
      description: `+${maxGain.value} ${LEVEL_UP_HIT_POINTS_LABELS.hitPointsPerLevelSuffix}`,
    },
    {
      value: 'roll',
      label: HIT_POINTS_GAIN_MODE_LABELS.roll,
      description: `1${hitDieLabel.value} ${LEVEL_UP_HIT_POINTS_LABELS.rollModeDescriptionSuffix}`,
    },
  ]);

  const isRollVisible = computed(() => draft.gainMode === 'roll');

  const rollButtonLabel = computed(() => {
    const action = draft.roll
      ? LEVEL_UP_HIT_POINTS_LABELS.reroll
      : LEVEL_UP_HIT_POINTS_LABELS.roll;

    return `${action} 1${hitDieLabel.value}`;
  });

  const isRollPending = computed(() => isRollVisible.value && !draft.roll);

  const constitutionHint = computed(
    () =>
      `${LEVEL_UP_HIT_POINTS_LABELS.constitutionTitle}: ${formattedConstitutionModifier.value} ${LEVEL_UP_HIT_POINTS_LABELS.perLevelSuffix}`,
  );

  const featureRows = computed(() =>
    step.features.map((feature) => ({
      ...feature,
      badgeLabel: `${feature.originLabel} · ${feature.level} ур.`,
      chooseLabel: feature.choice
        ? `${LEVEL_UP_WIZARD_LABELS.chooseLabel} ${feature.choice.count}`
        : '',
      options: feature.choice ? choiceOptions(feature.choice) : [],
    })),
  );

  /** Способ прироста из радиогруппы: контрол отдаёт значение нетипизированным. */
  function handleGainMode(value: unknown) {
    if (isHitPointsGainMode(value)) {
      emit('update:gain-mode', value);
    }
  }

  function handleRoll() {
    emit('roll');
  }

  function handleSelection(choice: ClassChoice, values: string[]) {
    emit('update:selection', choice.id, values.slice(0, choice.count));
  }

  function handleNote(featureId: string, value: string) {
    emit('update:note', featureId, value);
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="isHitPointsVisible"
      class="flex flex-col gap-2"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-x-2">
        <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
          {{ LEVEL_UP_HIT_POINTS_LABELS.title }}
        </span>

        <span class="text-xs text-dimmed">{{ constitutionHint }}</span>
      </div>

      <URadioGroup
        :model-value="draft.gainMode"
        :items="gainModeOptions"
        variant="list"
        color="warning"
        @update:model-value="handleGainMode"
      />

      <UButton
        v-if="isRollVisible"
        :label="rollButtonLabel"
        icon="ttg:dice-outline-d20"
        color="primary"
        variant="soft"
        block
        @click.left.exact.prevent="handleRoll"
      />

      <div
        v-if="draft.roll"
        class="flex items-baseline justify-between gap-2 rounded-lg bg-elevated/40 p-3 text-sm"
      >
        <span class="text-muted">
          {{ draft.roll.label }}: {{ draft.roll.rolled }}
          {{ draft.roll.formattedModifier }}
        </span>

        <span class="font-bold text-success">+{{ draft.roll.restored }}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">
          {{ LEVEL_UP_HIT_POINTS_LABELS.maxHitPointsTitle }}
        </span>

        <span
          v-if="isRollPending"
          class="text-dimmed italic"
        >
          {{ LEVEL_UP_HIT_POINTS_LABELS.rollPending }}
        </span>

        <span
          v-else
          class="font-bold text-highlighted"
        >
          +{{ step.hitPointsGain }}
        </span>
      </div>
    </div>

    <slot name="subclass" />

    <div class="flex flex-col gap-2">
      <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
        {{ LEVEL_UP_WIZARD_LABELS.featuresTitle }}
      </span>

      <div
        v-for="feature in featureRows"
        :key="feature.id"
        class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-bold text-highlighted">
            {{ feature.name }}
          </span>

          <UBadge
            size="sm"
            color="neutral"
            variant="subtle"
          >
            {{ feature.badgeLabel }}
          </UBadge>
        </div>

        <div
          v-if="feature.choice"
          class="flex flex-col gap-1"
        >
          <span class="text-xs text-muted">
            {{ feature.chooseLabel }}
          </span>

          <SheetChoiceSelect
            :model-value="draft.selections[feature.choice.id] ?? []"
            :items="feature.options"
            :count="feature.choice.count"
            :placeholder="feature.chooseLabel"
            @update:model-value="handleSelection(feature.choice, $event)"
          />
        </div>

        <UInput
          v-else
          :model-value="draft.notes[feature.id] ?? ''"
          size="sm"
          :placeholder="LEVEL_UP_WIZARD_LABELS.featureChoicePlaceholder"
          @update:model-value="handleNote(feature.id, String($event))"
        />

        <MarkupRender
          :render-node="feature.description"
          class="text-sm"
        />
      </div>

      <span
        v-if="!featureRows.length"
        class="text-xs text-dimmed italic"
      >
        {{ LEVEL_UP_WIZARD_LABELS.noFeatures }}
      </span>
    </div>
  </div>
</template>
