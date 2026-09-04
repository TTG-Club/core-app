<script setup lang="ts">
  import type {
    AbilityImprovementMode,
    AbilityKey,
    ClassChoice,
    ClassFeatureRow,
    HitPointsGainMode,
    LevelUpRailItem,
    LevelUpRailItemState,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet, useLevelUpWizard } from '../../composables';
  import {
    ABILITY_IMPROVEMENT_LABELS,
    EXPERIENCE_MAX,
    getCharacterClasses,
    getClassDisplayName,
    getFeaturesAboveLevel,
    getHitDieAverage,
    getLevelHitPointsGain,
    getLevelHitPointsLoss,
    LEVEL_MAX,
    LEVEL_MIN,
    LEVEL_UP_HIT_POINTS_LABELS,
    LEVEL_UP_WIZARD_LABELS,
    SHEET_WIZARD_SECTION_CLASS,
    SHEET_WIZARD_SECTION_TITLE_CLASS,
  } from '../../model';
  import SheetAbilityImprovementChoice from './SheetAbilityImprovementChoice.vue';
  import SheetLevelUpStep from './SheetLevelUpStep.vue';
  import SheetLevelUpStepsRail from './SheetLevelUpStepsRail.vue';

  /**
   * Состояние пункта рельсы относительно текущего шага.
   *
   * @param value номер пункта.
   * @param current номер текущего шага.
   * @returns пройден, текущий или впереди.
   */
  function getRailItemState(
    value: number,
    current: number,
  ): LevelUpRailItemState {
    if (value < current) {
      return 'done';
    }

    return value === current ? 'current' : 'upcoming';
  }

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const { character, setProgress, setClassLevels, applyLevelUp } =
    useCharacterSheet();

  const {
    steps,
    wizardSteps,
    drafts,
    abilityScoresFor,
    isLoading,
    hasLoadError,
    subclassOptions,
    isSubclassLoading,
    hasSubclassError,
    selectedSubclassUrl,
    isFeatsLoading,
    hasFeatsError,
    prepare,
    reset,
    setGainMode,
    rollHitDie,
    setSelection,
    setNote,
    setFeatChoice,
    setFeatAbility,
    abilityImprovement,
    setAbilityImprovementMode,
    stepAbilityImprovement,
    resetAbilityImprovement,
    selectSubclass,
    choiceControl,
    getFeatureRowPendingCount,
    retrySpellPool,
    featOptions,
    selectedFeat,
    isStepValid,
    getStepPendingCount,
    buildPayload,
  } = useLevelUpWizard();

  /** Идёт применение повышения: догружаются описания выбранных черт. */
  const isApplying = ref(false);

  const classes = computed(() => getCharacterClasses(character.value));

  const hasClass = computed(() => classes.value.length > 0);

  /** Черновик уровней по классам: правится строками таблицы уровней. */
  const draftClassLevels = ref<Record<string, number>>(
    Object.fromEntries(
      getCharacterClasses(character.value).map((characterClass) => [
        characterClass.url,
        characterClass.level,
      ]),
    ),
  );

  /** Уровень листа БЕЗ класса: суммировать нечего, он живёт сам по себе. */
  const draftLevel = ref(character.value.level);

  const draftExperience = ref(character.value.experience.current);

  const draftAdditionalExperience = ref(0);

  /** Уровень поднимается без мастера: ни выборов, ни броска на хиты. */
  const skipPreparation = ref(false);

  const totalExperience = computed(() =>
    Math.max(0, draftExperience.value + draftAdditionalExperience.value),
  );

  const constitutionModifier = computed(() =>
    getModifier(character.value.abilities.constitution),
  );

  /** Общий уровень черновика — сумма уровней классов (правило D&D). */
  const draftTotalLevel = computed(() =>
    hasClass.value
      ? classes.value.reduce(
          (total, characterClass) =>
            total + (draftClassLevels.value[characterClass.url] ?? 0),
          0,
        )
      : draftLevel.value,
  );

  /**
   * Строки таблицы уровней: максимум каждого класса ограничен свободным
   * остатком от 20 — как в инструменте мультикласса.
   */
  const classRows = computed(() =>
    classes.value.map((characterClass) => {
      const usedByOthers = classes.value
        .filter((entry) => entry.url !== characterClass.url)
        .reduce(
          (total, entry) => total + (draftClassLevels.value[entry.url] ?? 0),
          0,
        );

      return {
        url: characterClass.url,
        name: getClassDisplayName(characterClass),
        hitDie: characterClass.hitDie,
        max: Math.max(LEVEL_MIN, LEVEL_MAX - usedByOthers),
      };
    }),
  );

  /** Повышения по классам: только те, где уровень действительно растёт. */
  const targets = computed(() =>
    classes.value
      .map((characterClass) => ({
        classUrl: characterClass.url,
        from: characterClass.level,
        to: draftClassLevels.value[characterClass.url] ?? characterClass.level,
      }))
      .filter((target) => target.to > target.from),
  );

  /** Сколько уровней снимается у каждого класса. */
  const removedByClass = computed(() =>
    Object.fromEntries(
      classes.value.map((characterClass) => [
        characterClass.url,
        Math.max(
          0,
          characterClass.level
            - (draftClassLevels.value[characterClass.url] ?? 0),
        ),
      ]),
    ),
  );

  const levelsGained = computed(() =>
    targets.value.reduce(
      (total, target) => total + (target.to - target.from),
      0,
    ),
  );

  const levelsLost = computed(() =>
    Object.values(removedByClass.value).reduce(
      (total, count) => total + count,
      0,
    ),
  );

  /**
   * Шаг мастера с нуля: 0 — уровни и опыт, дальше по шагу на взятый уровень.
   * Уровни правятся только на нулевом шаге, поэтому шаги не «уезжают».
   */
  const stepIndex = ref(0);

  const isStepsMode = computed(() => stepIndex.value > 0);

  /** Мастер по уровням доступен: уровень растёт, класс есть, подготовку не пропускают. */
  const isWizardAvailable = computed(
    () => levelsGained.value > 0 && hasClass.value && !skipPreparation.value,
  );

  /** Пропускать подготовку есть что: уровень действительно растёт. */
  const isSkipPreparationAvailable = computed(() => levelsGained.value > 0);

  const skipPreparationHint = computed(() =>
    isSkipPreparationAvailable.value
      ? LEVEL_UP_WIZARD_LABELS.skipPreparationHint
      : LEVEL_UP_WIZARD_LABELS.skipPreparationIdleHint,
  );

  const isNoClassHintVisible = computed(
    () => draftLevel.value > character.value.level && !hasClass.value,
  );

  /** Показываемый шаг: уровень либо его повышение характеристик. */
  const currentView = computed(
    () => wizardSteps.value[stepIndex.value - 1] ?? null,
  );

  /** Номер черновика (и шага уровня), к которому относится показываемый шаг. */
  const currentDraftIndex = computed(() => currentView.value?.draftIndex ?? -1);

  const currentStep = computed(
    () => steps.value[currentDraftIndex.value] ?? null,
  );

  const currentDraft = computed(
    () => drafts.value[currentDraftIndex.value] ?? null,
  );

  const isAbilitiesView = computed(
    () => currentView.value?.key === 'abilities',
  );

  /**
   * Повышения характеристик показываемого шага: у уровня их обычно одно, но
   * умение подкласса может дать своё — тогда блоков будет два.
   */
  const abilityImprovementBlocks = computed(() => {
    const step = currentStep.value;

    if (!step || !isAbilitiesView.value) {
      return [];
    }

    return step.features
      .filter((feature) => feature.abilityImprovement)
      .flatMap((feature) =>
        feature.featChoices.map((choice) => {
          const improvement = abilityImprovement(
            currentDraftIndex.value,
            choice.id,
          );

          return {
            id: choice.id,
            scores: abilityScoresFor(choice.id),
            title: choice.label || feature.name,
            badgeLabel: `${feature.originLabel} · ${feature.level} ${LEVEL_UP_WIZARD_LABELS.levelWord}`,
            mode: improvement.mode,
            increases: improvement.increases,
            featOptions: featOptions(currentDraftIndex.value, choice),
            selectedFeat: selectedFeat(currentDraftIndex.value, choice.id),
            featAbilities:
              currentDraft.value?.featChoices[choice.id]?.abilities ?? [],
            featureId: feature.id,
          };
        }),
      );
  });

  const isLastStep = computed(
    () => isStepsMode.value && stepIndex.value === wizardSteps.value.length,
  );

  /**
   * Что ждёт впереди, пока шаги ещё не собраны: по пункту на каждый уровень
   * из набранных. Умения уровня и повышения характеристик здесь не значатся —
   * они известны только после загрузки классов, — но игрок сразу видит, из
   * скольких шагов состоит подготовка, а не пустую рельсу до «Далее».
   */
  const previewRailItems = computed<LevelUpRailItem[]>(() => {
    if (wizardSteps.value.length > 0) {
      return [];
    }

    return targets.value.flatMap((target) => {
      const name =
        classes.value.find(
          (characterClass) => characterClass.url === target.classUrl,
        )?.name ?? '';

      return Array.from(
        { length: target.to - target.from },
        (_, offset): LevelUpRailItem => ({
          value: -(offset + 1),
          title: `${name} · ${target.from + offset + 1} ${LEVEL_UP_WIZARD_LABELS.levelWord}`,
          subtitle: '',
          pending: 0,
          state: 'upcoming',
          nested: false,
          reachable: false,
        }),
      );
    });
  });

  /**
   * Пункты рельсы шагов: уровень и опыт, дальше — шаги мастера с подписью
   * класса и уровня, содержимым и счётчиком незакрытых выборов. Из рельсы
   * ходят только назад: вперёд ведёт «Далее» с проверкой шага.
   */
  const railItems = computed<LevelUpRailItem[]>(() => {
    const current = stepIndex.value;

    return [
      {
        value: 0,
        title: LEVEL_UP_WIZARD_LABELS.progressStep,
        subtitle: LEVEL_UP_WIZARD_LABELS.progressStepSubtitle,
        pending: 0,
        state: current === 0 ? 'current' : 'done',
        nested: false,
        reachable: true,
      },
      ...wizardSteps.value.map((step, index): LevelUpRailItem => {
        const value = index + 1;

        return {
          value,
          title: step.title,
          subtitle: step.subtitle,
          pending: getStepPendingCount(index),
          state: getRailItemState(value, current),
          nested: step.key === 'abilities',
          reachable: value <= current,
        };
      }),
      ...previewRailItems.value,
    ];
  });

  /** Заголовок окна: при росте уровня — про повышение, иначе про опыт. */
  const modalTitle = computed(() =>
    levelsGained.value > 0
      ? LEVEL_UP_WIZARD_LABELS.modalTitleLevelUp
      : LEVEL_UP_WIZARD_LABELS.modalTitle,
  );

  /**
   * Подзаголовок окна: текущий уровень каждого класса, а у того, чей уровень
   * правят, — «10 → 11». Строка стоит на месте с открытия окна: раньше она
   * появлялась только с первым набранным уровнем, и шапка дёргалась на каждое
   * нажатие «плюс».
   */
  const modalDescription = computed(() => {
    if (!hasClass.value) {
      const level = character.value.level;

      const title = LEVEL_UP_WIZARD_LABELS.levelStepTitle;

      return draftLevel.value === level
        ? `${title} ${level}`
        : `${title} ${level} → ${draftLevel.value}`;
    }

    return classes.value
      .map((characterClass) => {
        const name =
          classRows.value.find((row) => row.url === characterClass.url)?.name
          ?? '';

        const level = characterClass.level;

        const draft = draftClassLevels.value[characterClass.url] ?? level;

        return draft === level
          ? `${name} ${level}`
          : `${name} ${level} → ${draft}`;
      })
      .join(', ');
  });

  /** Незакрытые выборы одного умения текущего шага — для карточек умений. */
  function currentFeatureRowPendingCount(row: ClassFeatureRow): number {
    const draft = currentDraft.value;

    return draft ? getFeatureRowPendingCount(row, draft) : 0;
  }

  /**
   * Прирост хитов без мастера («Пропустить подготовку», сбой загрузки): среднее
   * значение кости класса, чей уровень берётся, с модификатором Телосложения.
   */
  const fallbackHitPointsGains = computed(() =>
    targets.value.flatMap((target) => {
      const hitDie =
        classes.value.find((entry) => entry.url === target.classUrl)?.hitDie
        ?? 0;

      const amount =
        hitDie > 0
          ? getLevelHitPointsGain(
              getHitDieAverage(hitDie),
              constitutionModifier.value,
            )
          : 0;

      return Array.from({ length: target.to - target.from }, () => ({
        classUrl: target.classUrl,
        amount,
      }));
    }),
  );

  const isRetryVisible = computed(
    () => hasLoadError.value && !isStepsMode.value,
  );

  const isNextVisible = computed(
    () =>
      isWizardAvailable.value
      && !isRetryVisible.value
      && (!isStepsMode.value || !isLastStep.value),
  );

  const isApplyVisible = computed(() => !isNextVisible.value);

  const isStepBlocked = computed(
    () => isStepsMode.value && !isStepValid(stepIndex.value - 1),
  );

  /** Сколько максимума вернут снимаемые уровни; 0 — прирост за них не записан. */
  const hitPointsLoss = computed(() =>
    levelsLost.value > 0
      ? getLevelHitPointsLoss(character.value.health, removedByClass.value)
      : 0,
  );

  const isLevelDownSectionVisible = computed(() => levelsLost.value > 0);

  /** Умения класса, которые уйдут с листа вместе со снятыми уровнями. */
  const removedFeatures = computed(() =>
    levelsLost.value > 0
      ? getFeaturesAboveLevel(character.value.features, draftClassLevels.value)
      : [],
  );

  const removedFeatureNames = computed(() =>
    removedFeatures.value.map((feature) => feature.name).join(', '),
  );

  const isRemovedFeaturesVisible = computed(
    () => removedFeatures.value.length > 0,
  );

  /** Прирост за снимаемые уровни записан — показываем, каким станет максимум. */
  const isLevelDownLossVisible = computed(() => hitPointsLoss.value > 0);

  const maxHitPointsLossLabel = computed(
    () =>
      `${character.value.health.max} → ${Math.max(0, character.value.health.max - hitPointsLoss.value)}`,
  );

  const levelDownHint = computed(() =>
    isLevelDownLossVisible.value
      ? LEVEL_UP_HIT_POINTS_LABELS.levelDownHint
      : LEVEL_UP_HIT_POINTS_LABELS.levelDownUnknownHint,
  );

  // Новая цель повышения — новые шаги: прежние броски и выборы к ней не
  // относятся. Пропуск подготовки мастер тоже обнуляет.
  watch([draftClassLevels, skipPreparation], () => {
    reset();
    stepIndex.value = 0;
  });

  async function handleNext() {
    if (!isStepsMode.value) {
      const isReady = await prepare(targets.value);

      if (isReady) {
        stepIndex.value = 1;
      }

      return;
    }

    if (isStepBlocked.value) {
      return;
    }

    stepIndex.value += 1;
  }

  function handleBack() {
    stepIndex.value = Math.max(0, stepIndex.value - 1);
  }

  /** Рельса водит только назад: вперёд пускает проверка шага в «Далее». */
  function handleRailSelect(value: number) {
    if (value < stepIndex.value) {
      stepIndex.value = value;
    }
  }

  /** Пул заклинаний выбора не загрузился — запросить его заново. */
  function handleSpellPoolRetry(choice: ClassChoice) {
    void retrySpellPool(choice);
  }

  function handleClassLevel(classUrl: string, level: number) {
    draftClassLevels.value = { ...draftClassLevels.value, [classUrl]: level };
  }

  function handleGainMode(mode: HitPointsGainMode) {
    setGainMode(currentDraftIndex.value, mode);
  }

  function handleRoll() {
    rollHitDie(currentDraftIndex.value);
  }

  function handleSelection(choiceId: string, values: string[]) {
    setSelection(currentDraftIndex.value, choiceId, values);
  }

  function handleNote(featureId: string, value: string) {
    setNote(currentDraftIndex.value, featureId, value);
  }

  function handleFeat(featureId: string, choiceId: string, featUrl: string) {
    setFeatChoice(currentDraftIndex.value, featureId, choiceId, featUrl);
  }

  function handleFeatAbility(
    choiceId: string,
    payload: { slot: number; ability: AbilityKey | null },
  ) {
    setFeatAbility(
      currentDraftIndex.value,
      choiceId,
      payload.slot,
      payload.ability,
    );
  }

  /**
   * Смена режима повышения характеристик на шаге.
   *
   * @param choiceId идентификатор выбора черты повышения.
   * @param mode выбранный режим.
   */
  function handleImprovementMode(
    choiceId: string,
    mode: AbilityImprovementMode,
  ) {
    setAbilityImprovementMode(currentDraftIndex.value, choiceId, mode);
  }

  /**
   * Шаг ± у характеристики в режиме прибавок.
   *
   * @param choiceId идентификатор выбора черты повышения.
   * @param payload характеристика и шаг изменения.
   * @param payload.ability ключ характеристики.
   * @param payload.delta шаг изменения.
   */
  function handleImprovementStep(
    choiceId: string,
    payload: { ability: AbilityKey; delta: number },
  ) {
    stepAbilityImprovement(
      currentDraftIndex.value,
      choiceId,
      payload.ability,
      payload.delta,
    );
  }

  /**
   * Сброс разложенных прибавок повышения.
   *
   * @param choiceId идентификатор выбора черты повышения.
   */
  function handleImprovementReset(choiceId: string) {
    resetAbilityImprovement(currentDraftIndex.value, choiceId);
  }

  /** Черты, доступные выбору черты на текущем шаге. */
  function currentFeatOptions(choice: ClassChoice) {
    return featOptions(currentDraftIndex.value, choice);
  }

  /** Черта, выбранная в выборе текущего шага. */
  function currentSelectedFeat(choiceId: string) {
    return selectedFeat(currentDraftIndex.value, choiceId);
  }

  /** Подклассы текущего шага, разрешённые источниками профиля. */
  const currentSubclassOptions = computed(() =>
    currentDraftIndex.value >= 0
      ? subclassOptions(currentDraftIndex.value)
      : [],
  );

  const currentSubclassUrl = computed(() =>
    currentDraftIndex.value >= 0
      ? selectedSubclassUrl(currentDraftIndex.value)
      : null,
  );

  function handleSubclassSelect(subclassUrl: string | null) {
    if (subclassUrl) {
      void selectSubclass(currentDraftIndex.value, subclassUrl);
    }
  }

  async function handleApply() {
    if (isStepBlocked.value || isApplying.value) {
      return;
    }

    if (isStepsMode.value) {
      isApplying.value = true;

      try {
        const payload = await buildPayload(totalExperience.value);

        if (payload) {
          applyLevelUp(payload);
          emit('close');

          return;
        }

        // Выбранную черту загрузить не удалось: молча применять повышение
        // нельзя — игрок остался бы без неё, не заметив потери.
        toast.add({
          color: 'error',
          icon: 'tabler:alert-triangle',
          title: ABILITY_IMPROVEMENT_LABELS.applyError,
        });

        return;
      } finally {
        isApplying.value = false;
      }
    }

    // Без мастера (пропуск подготовки, понижение уровня, ошибка загрузки)
    // меняются только уровни классов, опыт и хиты.
    if (hasClass.value) {
      setClassLevels(
        draftClassLevels.value,
        totalExperience.value,
        fallbackHitPointsGains.value,
      );
    } else {
      setProgress(draftLevel.value, totalExperience.value);
    }

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <!-- Окно шире обычной модалки листа: слева рельса шагов, справа карточки
    уровня с полями выбора — в стандартной ширине им было бы тесно -->
  <UModal
    :title="modalTitle"
    :description="modalDescription"
    :ui="{ content: 'sm:max-w-5xl' }"
  >
    <template #body>
      <!-- Рельса и содержимое шага прокручиваются каждое своим столбцом:
        длинное описание умения не должно уводить список шагов из виду -->
      <div class="flex flex-col gap-4 md:max-h-[70dvh] md:flex-row md:gap-6">
        <!-- Рельса стоит на месте с первого открытия: пока уровень не поднят,
          в ней один пункт «Уровень и опыт», а не пустота — окно не должно
          перекладываться на каждое нажатие «плюс» -->
        <SheetLevelUpStepsRail
          v-if="hasClass"
          :items="railItems"
          :model-value="stepIndex"
          class="shrink-0 md:min-h-0 md:w-60 md:overflow-y-auto md:pr-1"
          @update:model-value="handleRailSelect"
        />

        <div
          class="flex min-w-0 grow flex-col gap-3 md:min-h-96 md:overflow-y-auto md:pr-1"
        >
          <template v-if="!isStepsMode">
            <div
              v-if="hasClass"
              :class="SHEET_WIZARD_SECTION_CLASS"
            >
              <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
                {{ LEVEL_UP_WIZARD_LABELS.classLevelsTitle }}
              </span>

              <div
                v-for="row in classRows"
                :key="row.url"
                class="flex items-center justify-between gap-4"
              >
                <span class="min-w-0 truncate text-sm text-toned">
                  {{ row.name }}
                </span>

                <UInputNumber
                  :model-value="draftClassLevels[row.url]"
                  :min="LEVEL_MIN"
                  :max="row.max"
                  class="w-40 shrink-0"
                  @update:model-value="handleClassLevel(row.url, $event)"
                />
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">
                  {{ LEVEL_UP_WIZARD_LABELS.totalLevel }}
                </span>

                <span class="font-bold text-highlighted">
                  {{ draftTotalLevel }}
                </span>
              </div>

              <span class="text-xs text-dimmed">
                {{ LEVEL_UP_WIZARD_LABELS.classLevelsHint }}
              </span>
            </div>

            <div
              v-else
              :class="SHEET_WIZARD_SECTION_CLASS"
            >
              <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
                {{ LEVEL_UP_WIZARD_LABELS.levelStepTitle }}
              </span>

              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-toned">
                  {{ LEVEL_UP_WIZARD_LABELS.levelStepTitle }}
                </span>

                <UInputNumber
                  v-model="draftLevel"
                  :min="LEVEL_MIN"
                  :max="LEVEL_MAX"
                  class="w-40"
                />
              </div>
            </div>

            <div :class="SHEET_WIZARD_SECTION_CLASS">
              <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
                {{ LEVEL_UP_WIZARD_LABELS.experienceTitle }}
              </span>

              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-toned">
                  {{ LEVEL_UP_WIZARD_LABELS.currentExperience }}
                </span>

                <UInputNumber
                  v-model="draftExperience"
                  :min="0"
                  :max="EXPERIENCE_MAX"
                  class="w-40"
                />
              </div>

              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-toned">
                  {{ LEVEL_UP_WIZARD_LABELS.additionalExperience }}
                </span>

                <UInputNumber
                  v-model="draftAdditionalExperience"
                  :min="-EXPERIENCE_MAX"
                  :max="EXPERIENCE_MAX"
                  class="w-40"
                />
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">
                  {{ LEVEL_UP_WIZARD_LABELS.totalExperience }}
                </span>

                <span class="font-bold text-highlighted">{{
                  totalExperience
                }}</span>
              </div>
            </div>

            <!-- Пропуск подготовки: уровень поднимается сразу, без шагов
              мастера. Блок стоит на месте всегда, пока класс есть: он
              появлялся с первым набранным уровнем и пропадал обратно, и окно
              дёргалось на каждое нажатие «плюс». Пропускать нечего — галочка
              просто недоступна -->
            <div
              v-if="hasClass"
              :class="SHEET_WIZARD_SECTION_CLASS"
            >
              <UCheckbox
                v-model="skipPreparation"
                :disabled="!isSkipPreparationAvailable"
                :label="LEVEL_UP_WIZARD_LABELS.skipPreparation"
              />

              <span class="text-xs text-dimmed">
                {{ skipPreparationHint }}
              </span>
            </div>

            <span
              v-if="isNoClassHintVisible"
              class="text-xs text-dimmed"
            >
              {{ LEVEL_UP_WIZARD_LABELS.noClassHint }}
            </span>

            <span
              v-if="hasLoadError"
              class="text-xs text-primary"
            >
              {{ LEVEL_UP_WIZARD_LABELS.loadError }}
            </span>

            <div
              v-if="isLevelDownSectionVisible"
              :class="SHEET_WIZARD_SECTION_CLASS"
            >
              <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
                {{ LEVEL_UP_HIT_POINTS_LABELS.levelDownTitle }}
              </span>

              <div
                v-if="isLevelDownLossVisible"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-muted">
                  {{ LEVEL_UP_HIT_POINTS_LABELS.maxHitPointsTitle }}
                </span>

                <span class="font-bold text-highlighted">
                  {{ maxHitPointsLossLabel }}
                </span>
              </div>

              <span class="text-xs text-dimmed">
                {{ levelDownHint }}
              </span>

              <template v-if="isRemovedFeaturesVisible">
                <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
                  {{ LEVEL_UP_HIT_POINTS_LABELS.levelDownFeaturesTitle }}
                </span>

                <span class="text-sm text-toned">
                  {{ removedFeatureNames }}
                </span>

                <span class="text-xs text-dimmed">
                  {{ LEVEL_UP_HIT_POINTS_LABELS.levelDownFeaturesHint }}
                </span>
              </template>
            </div>
          </template>

          <!-- Повышение характеристик — своим шагом: уровень остаётся
            компактным, а прибавки и черта вместо них спрашиваются целиком -->
          <div
            v-else-if="isAbilitiesView"
            class="flex flex-col gap-3"
          >
            <SheetAbilityImprovementChoice
              v-for="block in abilityImprovementBlocks"
              :key="block.id"
              :title="block.title"
              :badge-label="block.badgeLabel"
              :mode="block.mode"
              :increases="block.increases"
              :scores="block.scores"
              :feat-options="block.featOptions"
              :selected-feat="block.selectedFeat"
              :feat-abilities="block.featAbilities"
              :is-feats-loading="isFeatsLoading"
              :has-feats-error="hasFeatsError"
              @update:mode="handleImprovementMode(block.id, $event)"
              @step="handleImprovementStep(block.id, $event)"
              @update:feat="handleFeat(block.featureId, block.id, $event)"
              @update:feat-ability="handleFeatAbility(block.id, $event)"
              @reset="handleImprovementReset(block.id)"
            />
          </div>

          <SheetLevelUpStep
            v-else-if="currentStep && currentDraft"
            :step="currentStep"
            :draft="currentDraft"
            :hit-die="currentStep.hitDie"
            :constitution-modifier="constitutionModifier"
            :abilities="character.abilities"
            :choice-control="choiceControl"
            :feature-row-pending-count="currentFeatureRowPendingCount"
            :feat-options="currentFeatOptions"
            :selected-feat="currentSelectedFeat"
            :is-feats-loading="isFeatsLoading"
            :has-feats-error="hasFeatsError"
            :subclass-options="currentSubclassOptions"
            :selected-subclass-url="currentSubclassUrl"
            :is-subclass-loading="isSubclassLoading"
            :has-subclass-error="hasSubclassError"
            @update:gain-mode="handleGainMode"
            @roll="handleRoll"
            @update:selection="handleSelection"
            @update:note="handleNote"
            @update:feat="handleFeat"
            @update:feat-ability="handleFeatAbility"
            @retry-spell-pool="handleSpellPoolRetry"
            @update:subclass="handleSubclassSelect"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          v-if="isStepsMode"
          :label="LEVEL_UP_WIZARD_LABELS.back"
          icon="tabler:arrow-left"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleBack"
        />

        <span v-else />

        <div class="flex gap-2">
          <UButton
            :label="ACTION_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            v-if="isNextVisible"
            :label="LEVEL_UP_WIZARD_LABELS.next"
            icon="tabler:arrow-right"
            color="primary"
            :loading="isLoading"
            :disabled="isStepBlocked"
            @click.left.exact.prevent="handleNext"
          />

          <UButton
            v-if="isRetryVisible"
            :label="LEVEL_UP_WIZARD_LABELS.retry"
            icon="tabler:refresh"
            color="neutral"
            variant="subtle"
            :loading="isLoading"
            @click.left.exact.prevent="handleNext"
          />

          <UButton
            v-if="isApplyVisible"
            :label="LEVEL_UP_WIZARD_LABELS.apply"
            color="primary"
            :loading="isApplying"
            :disabled="isStepBlocked"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
