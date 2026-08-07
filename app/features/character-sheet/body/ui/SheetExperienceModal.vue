<script setup lang="ts">
  import type { StepperItem } from '@nuxt/ui';

  import type { AbilityKey, HitPointsGainMode } from '../../model';

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
  } from '../../model';
  import SheetLevelUpStep from './SheetLevelUpStep.vue';
  import SheetLevelUpSubclassPicker from './SheetLevelUpSubclassPicker.vue';

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const { character, setProgress, setClassLevels, applyLevelUp } =
    useCharacterSheet();

  const {
    steps,
    drafts,
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
    selectSubclass,
    choiceOptions,
    choiceHints,
    featOptions,
    selectedFeat,
    isStepValid,
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

  const isNoClassHintVisible = computed(
    () => draftLevel.value > character.value.level && !hasClass.value,
  );

  const currentStep = computed(() => steps.value[stepIndex.value - 1] ?? null);

  const currentDraft = computed(
    () => drafts.value[stepIndex.value - 1] ?? null,
  );

  const isLastStep = computed(
    () => isStepsMode.value && stepIndex.value === steps.value.length,
  );

  const stepperItems = computed<StepperItem[]>(() => [
    { value: 0, title: LEVEL_UP_WIZARD_LABELS.progressStep },
    ...steps.value.map((step) => ({
      value: step.index + 1,
      title: `${step.level} ур.`,
    })),
  ]);

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

  /** Степпер водит только назад: вперёд пускает проверка шага в «Далее». */
  function handleStepperUpdate(value: string | number | undefined) {
    if (typeof value === 'number' && value < stepIndex.value) {
      stepIndex.value = value;
    }
  }

  function handleClassLevel(classUrl: string, level: number) {
    draftClassLevels.value = { ...draftClassLevels.value, [classUrl]: level };
  }

  function handleGainMode(mode: HitPointsGainMode) {
    setGainMode(stepIndex.value - 1, mode);
  }

  function handleRoll() {
    rollHitDie(stepIndex.value - 1);
  }

  function handleSelection(choiceId: string, values: string[]) {
    setSelection(stepIndex.value - 1, choiceId, values);
  }

  function handleNote(featureId: string, value: string) {
    setNote(stepIndex.value - 1, featureId, value);
  }

  function handleFeat(featureId: string, featUrl: string) {
    setFeatChoice(stepIndex.value - 1, featureId, featUrl);
  }

  function handleFeatAbility(
    featureId: string,
    payload: { slot: number; ability: AbilityKey | null },
  ) {
    setFeatAbility(
      stepIndex.value - 1,
      featureId,
      payload.slot,
      payload.ability,
    );
  }

  /** Черты, доступные умению текущего шага. */
  function currentFeatOptions(featureId: string) {
    return featOptions(stepIndex.value - 1, featureId);
  }

  /** Черта, выбранная в умении текущего шага. */
  function currentSelectedFeat(featureId: string) {
    return selectedFeat(stepIndex.value - 1, featureId);
  }

  function handleSubclassSelect(subclassUrl: string | null) {
    if (subclassUrl) {
      void selectSubclass(stepIndex.value - 1, subclassUrl);
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
  <UModal
    title="Опыт и уровень"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div
          v-if="isWizardAvailable"
          class="overflow-x-auto"
        >
          <UStepper
            :model-value="stepIndex"
            :items="stepperItems"
            size="xs"
            color="primary"
            linear
            @update:model-value="handleStepperUpdate"
          />
        </div>

        <template v-if="!isStepsMode">
          <template v-if="hasClass">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
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
          </template>

          <div
            v-else
            class="flex items-center justify-between gap-4"
          >
            <span class="text-sm text-toned">Уровень</span>

            <UInputNumber
              v-model="draftLevel"
              :min="LEVEL_MIN"
              :max="LEVEL_MAX"
              class="w-40"
            />
          </div>

          <USeparator class="my-1" />

          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">Текущий опыт</span>

            <UInputNumber
              v-model="draftExperience"
              :min="0"
              :max="EXPERIENCE_MAX"
              class="w-40"
            />
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">Добавить опыт</span>

            <UInputNumber
              v-model="draftAdditionalExperience"
              :min="-EXPERIENCE_MAX"
              :max="EXPERIENCE_MAX"
              class="w-40"
            />
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Итого опыта</span>

            <span class="font-bold text-highlighted">{{
              totalExperience
            }}</span>
          </div>

          <!-- Пропуск подготовки: уровень поднимается сразу, без шагов мастера.
            Показываем только когда шаги вообще были бы — при понижении уровня
            и без класса пропускать нечего -->
          <template v-if="levelsGained > 0 && hasClass">
            <USeparator class="my-1" />

            <UCheckbox
              v-model="skipPreparation"
              :label="LEVEL_UP_WIZARD_LABELS.skipPreparation"
            />

            <span class="text-xs text-dimmed">
              {{ LEVEL_UP_WIZARD_LABELS.skipPreparationHint }}
            </span>
          </template>

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

          <template v-if="isLevelDownSectionVisible">
            <USeparator class="my-1" />

            <div class="flex flex-col gap-2">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
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
                <span
                  class="text-[10px] font-bold tracking-wider text-muted uppercase"
                >
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
        </template>

        <SheetLevelUpStep
          v-else-if="currentStep && currentDraft"
          :step="currentStep"
          :draft="currentDraft"
          :hit-die="currentStep.hitDie"
          :constitution-modifier="constitutionModifier"
          :abilities="character.abilities"
          :choice-options="choiceOptions"
          :choice-hints="choiceHints"
          :feat-options="currentFeatOptions"
          :selected-feat="currentSelectedFeat"
          :is-feats-loading="isFeatsLoading"
          :has-feats-error="hasFeatsError"
          @update:gain-mode="handleGainMode"
          @roll="handleRoll"
          @update:selection="handleSelection"
          @update:note="handleNote"
          @update:feat="handleFeat"
          @update:feat-ability="handleFeatAbility"
        >
          <template
            v-if="currentStep.isSubclassStep"
            #subclass
          >
            <SheetLevelUpSubclassPicker
              :model-value="selectedSubclassUrl(stepIndex - 1)"
              :options="subclassOptions(stepIndex - 1)"
              :is-loading="isSubclassLoading"
              :has-error="hasSubclassError"
              @update:model-value="handleSubclassSelect"
            />
          </template>
        </SheetLevelUpStep>
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
            label="Отмена"
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
