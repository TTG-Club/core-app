<script setup lang="ts">
  import type {
    AbilityKey,
    CharacterAbilities,
    ClassChoice,
    FeatSelectOption,
    HitPointsGainMode,
    LevelUpStepDraft,
    LevelUpStepView,
  } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    getHitDieAverage,
    getHitDieLabel,
    getLevelHitPointsGain,
    getRequiredChoiceCount,
    HIT_POINTS_GAIN_MODE_LABELS,
    isHitPointsGainMode,
    LEVEL_SHORT_SUFFIX,
    LEVEL_UP_HIT_POINTS_LABELS,
    LEVEL_UP_WIZARD_LABELS,
    SKILL_DUPLICATE_WARNING,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';
  import SheetLevelUpFeatChoice from './SheetLevelUpFeatChoice.vue';

  const {
    step,
    draft,
    hitDie,
    constitutionModifier,
    abilities,
    choiceOptions,
    choiceHints,
    featOptions,
    selectedFeat,
    isFeatsLoading = false,
    hasFeatsError = false,
  } = defineProps<{
    /** Шаг мастера: уровень, его умения и прирост хитов. */
    step: LevelUpStepView;

    /** Черновик шага: выбранный способ прироста, бросок и выборы игрока. */
    draft: LevelUpStepDraft;

    /** Номинал кости хитов класса; 0 — класс неизвестен. */
    hitDie: number;

    constitutionModifier: number;

    /** Текущие характеристики персонажа (для предела прибавок в чертах). */
    abilities: CharacterAbilities;

    /** Опции пикера для выбора внутри умения. */
    choiceOptions: (choice: ClassChoice) => string[];

    /** Пометки опций пикера: навыки, которыми персонаж уже владеет. */
    choiceHints: (choice: ClassChoice) => Record<string, string>;

    /** Черты, доступные выбору черты в умении. */
    featOptions: (choice: ClassChoice) => FeatSelectOption[];

    /** Черта, выбранная в выборе; null — выбора не было. */
    selectedFeat: (choiceId: string) => FeatSelectOption | null;

    isFeatsLoading?: boolean;

    /** Каталог черт загрузить не удалось. */
    hasFeatsError?: boolean;
  }>();

  const emit = defineEmits<{
    'update:gain-mode': [mode: HitPointsGainMode];
    'roll': [];
    'update:selection': [choiceId: string, values: string[]];
    'update:note': [featureId: string, value: string];
    'update:feat': [featureId: string, choiceId: string, featUrl: string];
    'update:feat-ability': [
      choiceId: string,
      payload: { slot: number; ability: AbilityKey | null },
    ];
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
    step.features.map((feature) => {
      // Каждый выбор умения тянет за собой свой пул, своё количество и свои
      // пометки: считаются они здесь, чтобы шаблон остался декларативным
      const controls = feature.choices.map((choice) => {
        const options = choiceOptions(choice);
        const requiredCount = getRequiredChoiceCount(choice, options);

        return {
          choice,
          options,
          requiredCount,
          hints: choiceHints(choice),
          chooseLabel: `${LEVEL_UP_WIZARD_LABELS.chooseLabel} ${requiredCount}`,
        };
      });

      // Выборы черты — боевой стиль, черта за повышение характеристик —
      // спрашиваются пикером каталога черт, каждый со своим пулом
      const featPickers = feature.featChoices.map((choice) => ({
        choice,
        options: featOptions(choice),
        selected: selectedFeat(choice.id),
        abilities: draft.featChoices[choice.id]?.abilities ?? [],
      }));

      return {
        ...feature,
        badgeLabel: `${feature.originLabel} · ${feature.level} ур.`,
        controls,
        featPickers,
        // Свободный текст остаётся только умению без единого пикера
        hasNote: controls.length === 0 && featPickers.length === 0,
      };
    }),
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

  function handleSelection(
    choice: ClassChoice,
    requiredCount: number,
    values: string[],
  ) {
    emit('update:selection', choice.id, values.slice(0, requiredCount));
  }

  function handleNote(featureId: string, value: string) {
    emit('update:note', featureId, value);
  }

  function handleFeat(featureId: string, choiceId: string, featUrl: string) {
    emit('update:feat', featureId, choiceId, featUrl);
  }

  function handleFeatAbility(
    choiceId: string,
    payload: { slot: number; ability: AbilityKey | null },
  ) {
    emit('update:feat-ability', choiceId, payload);
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- У мультикласса шаги разных классов идут подряд, поэтому у каждого
      подписано, чей это уровень -->
    <div
      v-if="step.className"
      class="flex flex-wrap items-baseline gap-x-2 text-sm"
    >
      <span class="text-muted"
        >{{ LEVEL_UP_WIZARD_LABELS.stepClassPrefix }}:</span
      >

      <span class="font-bold text-highlighted">{{ step.className }}</span>

      <span class="text-xs text-dimmed">
        {{ step.classLevel }} {{ LEVEL_SHORT_SUFFIX }}
      </span>
    </div>

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
        color="primary"
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
          v-if="feature.controls.length"
          class="flex flex-col gap-3"
        >
          <div
            v-for="control in feature.controls"
            :key="control.choice.id"
            class="flex flex-col gap-1"
          >
            <span class="text-xs text-muted">
              {{ control.choice.label || control.chooseLabel }}
            </span>

            <SheetChoiceSelect
              :model-value="draft.selections[control.choice.id] ?? []"
              :items="control.options"
              :hints="control.hints"
              :warning="SKILL_DUPLICATE_WARNING"
              :count="control.requiredCount"
              :placeholder="control.chooseLabel"
              @update:model-value="
                handleSelection(control.choice, control.requiredCount, $event)
              "
            />
          </div>
        </div>

        <div
          v-if="feature.featPickers.length"
          class="flex flex-col gap-3"
        >
          <SheetLevelUpFeatChoice
            v-for="picker in feature.featPickers"
            :key="picker.choice.id"
            :title="picker.choice.label"
            :options="picker.options"
            :selected="picker.selected"
            :abilities="picker.abilities"
            :scores="abilities"
            :is-loading="isFeatsLoading"
            :has-error="hasFeatsError"
            @update:feat="handleFeat(feature.id, picker.choice.id, $event)"
            @update:ability="handleFeatAbility(picker.choice.id, $event)"
          />
        </div>

        <UInput
          v-if="feature.hasNote"
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
