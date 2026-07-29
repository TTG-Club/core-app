<script setup lang="ts">
  import type { StepperItem } from '@nuxt/ui';

  import type { AbilityKey, HitPointsGainMode } from '../../model';

  import { useCharacterSheet, useLevelUpWizard } from '../../composables';
  import {
    ABILITY_IMPROVEMENT_LABELS,
    EXPERIENCE_MAX,
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

  const { character, setProgress, applyLevelUp } = useCharacterSheet();

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
    featOptions,
    selectedFeat,
    isStepValid,
    buildPayload,
  } = useLevelUpWizard();

  /** Идёт применение повышения: догружаются описания выбранных черт. */
  const isApplying = ref(false);

  const draftLevel = ref(character.value.level);

  const draftExperience = ref(character.value.experience.current);

  const draftAdditionalExperience = ref(0);

  const totalExperience = computed(() =>
    Math.max(0, draftExperience.value + draftAdditionalExperience.value),
  );

  const classDie = computed(() => character.value.characterClass?.hitDie ?? 0);

  const hasClass = computed(() => character.value.characterClass !== null);

  const constitutionModifier = computed(() =>
    getModifier(character.value.abilities.constitution),
  );

  const levelsGained = computed(() =>
    Math.max(0, draftLevel.value - character.value.level),
  );

  const levelsLost = computed(() =>
    Math.max(0, character.value.level - draftLevel.value),
  );

  /**
   * Шаг мастера с нуля: 0 — уровень и опыт, дальше по шагу на взятый уровень.
   * Уровень правится только на нулевом шаге, поэтому шаги не «уезжают».
   */
  const stepIndex = ref(0);

  const isStepsMode = computed(() => stepIndex.value > 0);

  /** Мастер по уровням доступен: уровень растёт и класс на листе выбран. */
  const isWizardAvailable = computed(
    () => levelsGained.value > 0 && hasClass.value,
  );

  const isNoClassHintVisible = computed(
    () => levelsGained.value > 0 && !hasClass.value,
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

  /** Прирост хитов, если умения загрузить не удалось: среднее значение кости. */
  const fallbackHitPointsGains = computed<number[]>(() => {
    if (levelsGained.value <= 0 || classDie.value <= 0) {
      return [];
    }

    const gain = getLevelHitPointsGain(
      getHitDieAverage(classDie.value),
      constitutionModifier.value,
    );

    return Array.from({ length: levelsGained.value }, () => gain);
  });

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
      ? getLevelHitPointsLoss(character.value.health, draftLevel.value)
      : 0,
  );

  const isLevelDownSectionVisible = computed(() => levelsLost.value > 0);

  /** Умения класса, которые уйдут с листа вместе со снятыми уровнями. */
  const removedFeatures = computed(() =>
    levelsLost.value > 0
      ? getFeaturesAboveLevel(character.value.features, draftLevel.value)
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
  // относятся.
  watch(draftLevel, () => {
    reset();
    stepIndex.value = 0;
  });

  async function handleNext() {
    if (!isStepsMode.value) {
      const isReady = await prepare(draftLevel.value);

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
      void selectSubclass(subclassUrl);
    }
  }

  async function handleApply() {
    if (isStepBlocked.value || isApplying.value) {
      return;
    }

    if (isStepsMode.value) {
      isApplying.value = true;

      try {
        const payload = await buildPayload(
          draftLevel.value,
          totalExperience.value,
        );

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

    // Без мастера (нет класса, понижение уровня, ошибка загрузки) меняются
    // только уровень, опыт и хиты.
    setProgress(
      draftLevel.value,
      totalExperience.value,
      fallbackHitPointsGains.value,
    );

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
          <div class="flex items-center justify-between gap-4">
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

          <span
            v-if="isNoClassHintVisible"
            class="text-xs text-dimmed"
          >
            {{ LEVEL_UP_WIZARD_LABELS.noClassHint }}
          </span>

          <span
            v-if="hasLoadError"
            class="text-xs text-warning"
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
          :hit-die="classDie"
          :constitution-modifier="constitutionModifier"
          :abilities="character.abilities"
          :choice-options="choiceOptions"
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
              :model-value="selectedSubclassUrl"
              :options="subclassOptions"
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
