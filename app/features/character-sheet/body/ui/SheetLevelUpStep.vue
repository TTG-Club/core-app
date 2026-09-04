<script setup lang="ts">
  import type {
    AbilityKey,
    CharacterAbilities,
    ClassChoice,
    ClassFeatureRow,
    ClassOption,
    FeatSelectOption,
    HitPointsGainMode,
    LevelUpStepDraft,
    LevelUpStepView,
    SheetChoiceControl,
    SheetChoiceOrigin,
  } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    ABILITY_IMPROVEMENT_LABELS,
    getChoiceModalSubtitle,
    getHitDieAverage,
    getHitDieLabel,
    getLevelHitPointsGain,
    HIT_POINTS_GAIN_MODE_LABELS,
    isHitPointsGainMode,
    LEVEL_UP_HIT_POINTS_LABELS,
    LEVEL_UP_WIZARD_LABELS,
    SHEET_WIZARD_FEATURE_CARD_CLASS,
    SHEET_WIZARD_SECTION_CLASS,
    SHEET_WIZARD_SECTION_TITLE_CLASS,
    SKILL_DUPLICATE_WARNING,
    toSubclassPickerOptions,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';
  import SheetFeatChoiceField from './SheetFeatChoiceField.vue';

  /** Выбор черты внутри умения с пулом и ответом игрока. */
  interface FeatPicker {
    choice: ClassChoice;
    title: string;
    modalSubtitle: string;
    options: FeatSelectOption[];
    selected: FeatSelectOption | null;
    abilities: (AbilityKey | null)[];
  }

  const {
    step,
    draft,
    hitDie,
    constitutionModifier,
    abilities,
    choiceControl,
    featureRowPendingCount,
    featOptions,
    selectedFeat,
    isFeatsLoading = false,
    hasFeatsError = false,
    subclassOptions,
    selectedSubclassUrl = null,
    isSubclassLoading = false,
    hasSubclassError = false,
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

    /** Выбор умения для единого пикера: варианты, готовность, подписи. */
    choiceControl: (
      choice: ClassChoice,
      origin: SheetChoiceOrigin,
    ) => SheetChoiceControl;

    /** Сколько выборов умения на этом шаге ещё не сделано. */
    featureRowPendingCount: (row: ClassFeatureRow) => number;

    /** Черты, доступные выбору черты в умении. */
    featOptions: (choice: ClassChoice) => FeatSelectOption[];

    /** Черта, выбранная в выборе; null — выбора не было. */
    selectedFeat: (choiceId: string) => FeatSelectOption | null;

    isFeatsLoading?: boolean;

    /** Каталог черт загрузить не удалось. */
    hasFeatsError?: boolean;

    /** Подклассы, разрешённые источниками профиля (на шаге подкласса). */
    subclassOptions: ClassOption[];

    /** Url выбранного подкласса; null — ещё не выбран. */
    selectedSubclassUrl?: string | null;

    isSubclassLoading?: boolean;

    /** Список подклассов загрузить не удалось — выбор можно сделать позже. */
    hasSubclassError?: boolean;
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
    'retry-spell-pool': [choice: ClassChoice];
    'update:subclass': [subclassUrl: string | null];
  }>();

  const stepTitle = computed(
    () =>
      `${step.className} · ${step.classLevel} ${LEVEL_UP_WIZARD_LABELS.levelWord}`,
  );

  /** Общий уровень персонажа отличается от уровня в классе — у мультикласса. */
  const totalLevelLabel = computed(() =>
    step.level !== step.classLevel
      ? `${LEVEL_UP_WIZARD_LABELS.totalLevel}: ${step.level}`
      : '',
  );

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

  /** Подкласс — своим полем пикера: список бывает на десяток записей с описаниями. */
  const subclassPickerOptions = computed(() =>
    toSubclassPickerOptions(subclassOptions),
  );

  const subclassValues = computed(() =>
    selectedSubclassUrl ? [selectedSubclassUrl] : [],
  );

  const subclassStatus = computed(() =>
    isSubclassLoading ? 'loading' : 'ready',
  );

  const subclassModalSubtitle = computed(() =>
    getChoiceModalSubtitle(
      {
        featureName: LEVEL_UP_WIZARD_LABELS.subclassTitle,
        originLabel: step.className,
        level: step.classLevel,
      },
      1,
    ),
  );

  /** Умения, свёрнутые игроком: по умолчанию все карточки раскрыты. */
  const collapsedFeatureIds = ref(new Set<string>());

  /**
   * Незаполненные выборы черт умения: без черты либо с пустым слотом
   * характеристики. Сбой каталога черт требование снимает — как в мастере.
   *
   * @param pickers выборы черт умения.
   * @returns сколько выборов черт ещё не заполнено.
   */
  function getPendingFeatPickerCount(pickers: FeatPicker[]): number {
    if (hasFeatsError) {
      return 0;
    }

    return pickers.filter(
      (picker) => !picker.selected || picker.abilities.includes(null),
    ).length;
  }

  // Повышение характеристик спрашивается своим шагом, поэтому среди карточек
  // уровня его строки нет: иначе выбор был бы в двух местах сразу. Строка без
  // единого выбора остаётся здесь — своего шага у неё не будет, а описание
  // умения игрок прочесть должен.
  const featureRows = computed(() =>
    step.features
      .filter(
        (feature) =>
          !feature.abilityImprovement || feature.featChoices.length === 0,
      )
      .map((feature) => {
        const origin: SheetChoiceOrigin = {
          featureName: feature.name,
          originLabel: feature.originLabel,
          level: feature.level,
        };

        // Каждый выбор умения собирается единым пикером: варианты, готовность
        // пула, подписи поля и окна считаются здесь, чтобы шаблон остался
        // декларативным
        const controls = feature.choices.map((choice) =>
          choiceControl(choice, origin),
        );

        // Выборы черты — боевой стиль и подобные — спрашиваются тем же полем с
        // пулом каталога черт
        const featPickers: FeatPicker[] = feature.featChoices.map((choice) => ({
          choice,
          title: choice.label || ABILITY_IMPROVEMENT_LABELS.featTitle,
          modalSubtitle: getChoiceModalSubtitle(origin, 1),
          options: featOptions(choice),
          selected: selectedFeat(choice.id),
          abilities: draft.featChoices[choice.id]?.abilities ?? [],
        }));

        const pending =
          featureRowPendingCount(feature)
          + getPendingFeatPickerCount(featPickers);

        const isExpanded = !collapsedFeatureIds.value.has(feature.id);

        return {
          ...feature,
          badgeLabel: `${feature.originLabel} · ${feature.level} ${LEVEL_UP_WIZARD_LABELS.levelWord}`,
          controls,
          featPickers,
          pending,
          isExpanded,
          chevronIcon: isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down',
          // Свободный текст остаётся только умению без единого пикера
          hasNote: controls.length === 0 && featPickers.length === 0,
        };
      }),
  );

  /**
   * Сворачивает или раскрывает карточку умения.
   *
   * @param featureId идентификатор умения.
   */
  function toggleFeature(featureId: string) {
    if (collapsedFeatureIds.value.has(featureId)) {
      collapsedFeatureIds.value.delete(featureId);

      return;
    }

    collapsedFeatureIds.value.add(featureId);
  }

  /** Способ прироста из радиогруппы: контрол отдаёт значение нетипизированным. */
  function handleGainMode(value: unknown) {
    if (isHitPointsGainMode(value)) {
      emit('update:gain-mode', value);
    }
  }

  function handleRoll() {
    emit('roll');
  }

  function handleSelection(control: SheetChoiceControl, values: string[]) {
    emit(
      'update:selection',
      control.choice.id,
      control.requiredCount > 0
        ? values.slice(0, control.requiredCount)
        : values,
    );
  }

  function handleSpellPoolRetry(choice: ClassChoice) {
    emit('retry-spell-pool', choice);
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

  function handleSubclass(values: string[]) {
    emit('update:subclass', values[0] ?? null);
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- У мультикласса шаги разных классов идут подряд, поэтому у каждого
      подписано, чей это уровень -->
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3 class="text-base font-bold text-highlighted">{{ stepTitle }}</h3>

      <span
        v-if="totalLevelLabel"
        class="text-xs text-dimmed"
      >
        {{ totalLevelLabel }}
      </span>
    </div>

    <div
      v-if="isHitPointsVisible"
      :class="SHEET_WIZARD_SECTION_CLASS"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-x-2">
        <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
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

    <div
      v-if="step.isSubclassStep"
      :class="SHEET_WIZARD_SECTION_CLASS"
    >
      <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
        {{ LEVEL_UP_WIZARD_LABELS.subclassTitle }}
      </span>

      <span
        v-if="hasSubclassError"
        class="text-xs text-primary"
      >
        {{ LEVEL_UP_WIZARD_LABELS.subclassError }}
      </span>

      <!-- Описание подкласса — только дровером: в панели рядом со списком
        таблица класса всё равно не читается -->
      <SheetChoicePickerField
        v-else
        :title="LEVEL_UP_WIZARD_LABELS.subclassTitle"
        :explanation="LEVEL_UP_WIZARD_LABELS.subclassExplanation"
        :modal-subtitle="subclassModalSubtitle"
        :options="subclassPickerOptions"
        :count="1"
        :status="subclassStatus"
        hide-detail-pane
        :model-value="subclassValues"
        @update:model-value="handleSubclass"
      />

      <span class="text-xs text-dimmed">
        {{ LEVEL_UP_WIZARD_LABELS.subclassHint }}
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
        {{ LEVEL_UP_WIZARD_LABELS.featuresTitle }}
      </span>

      <div
        v-for="feature in featureRows"
        :key="feature.id"
        :class="SHEET_WIZARD_FEATURE_CARD_CLASS"
      >
        <button
          type="button"
          class="flex w-full cursor-pointer flex-wrap items-center gap-2 rounded-lg p-3 text-left transition-colors hover:bg-elevated/40"
          :aria-expanded="feature.isExpanded"
          @click.left.exact.prevent="toggleFeature(feature.id)"
        >
          <UIcon
            :name="feature.chevronIcon"
            class="size-4 shrink-0 text-muted"
          />

          <span class="min-w-0 grow text-sm font-bold text-highlighted">
            {{ feature.name }}
          </span>

          <UBadge
            v-if="feature.pending"
            size="sm"
            color="warning"
            variant="subtle"
            class="shrink-0"
            :aria-label="`${LEVEL_UP_WIZARD_LABELS.pendingBadgeAriaLabel}: ${feature.pending}`"
          >
            {{ feature.pending }}
          </UBadge>

          <UBadge
            size="sm"
            color="neutral"
            variant="subtle"
            class="shrink-0"
          >
            {{ feature.badgeLabel }}
          </UBadge>
        </button>

        <div
          v-if="feature.isExpanded"
          class="flex flex-col gap-3 border-t border-default/50 p-3"
        >
          <SheetChoicePickerField
            v-for="control in feature.controls"
            :key="control.choice.id"
            :title="control.title"
            :explanation="control.explanation"
            :modal-title="control.modalTitle"
            :modal-subtitle="control.modalSubtitle"
            :options="control.options"
            :count="control.requiredCount"
            :status="control.status"
            :warning="SKILL_DUPLICATE_WARNING"
            :model-value="draft.selections[control.choice.id] ?? []"
            @update:model-value="handleSelection(control, $event)"
            @retry="handleSpellPoolRetry(control.choice)"
          />

          <SheetFeatChoiceField
            v-for="picker in feature.featPickers"
            :key="picker.choice.id"
            :title="picker.title"
            :modal-subtitle="picker.modalSubtitle"
            :options="picker.options"
            :selected="picker.selected"
            :abilities="picker.abilities"
            :scores="abilities"
            :is-loading="isFeatsLoading"
            :has-error="hasFeatsError"
            @update:feat="handleFeat(feature.id, picker.choice.id, $event)"
            @update:ability="handleFeatAbility(picker.choice.id, $event)"
          />

          <UInput
            v-if="feature.hasNote"
            :model-value="draft.notes[feature.id] ?? ''"
            size="sm"
            :placeholder="LEVEL_UP_WIZARD_LABELS.featureChoicePlaceholder"
            @update:model-value="handleNote(feature.id, String($event))"
          />

          <div class="flex flex-col gap-1">
            <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
              {{ LEVEL_UP_WIZARD_LABELS.featureDescriptionTitle }}
            </span>

            <MarkupRender
              :render-node="feature.description"
              class="text-sm"
            />
          </div>
        </div>
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
