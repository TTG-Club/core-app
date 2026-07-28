<script setup lang="ts">
  import type { HitDieRollResult, HitPointsGainMode } from '../../model';

  import { useDiceRoller } from '~dice-roller/composables';

  import { useCharacterSheet } from '../../composables';
  import {
    EXPERIENCE_MAX,
    getHitDieAverage,
    getHitDieFormula,
    getHitDieLabel,
    getLevelHitPointsGain,
    getLevelHitPointsLoss,
    HIT_POINTS_GAIN_MODE_LABELS,
    LEVEL_MAX,
    LEVEL_MIN,
    LEVEL_UP_HIT_POINTS_LABELS,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setProgress } = useCharacterSheet();

  // Кости хитов новых уровней катятся напрямую роллером: результат каждой кости
  // нужен здесь, чтобы прибавить модификатор Телосложения к каждому уровню.
  const { rollValue } = useDiceRoller();

  const draftLevel = ref(character.value.level);

  const draftExperience = ref(character.value.experience.current);

  const draftAdditionalExperience = ref(0);

  const totalExperience = computed(() =>
    Math.max(0, draftExperience.value + draftAdditionalExperience.value),
  );

  const classDie = computed(
    () => character.value.characterClass?.hitDie ?? null,
  );

  const levelsGained = computed(() =>
    Math.max(0, draftLevel.value - character.value.level),
  );

  const levelsLost = computed(() =>
    Math.max(0, character.value.level - draftLevel.value),
  );

  /** Секция прироста хитов: уровень растёт и кость хитов класса известна. */
  const isHitPointsSectionVisible = computed(
    () => levelsGained.value > 0 && classDie.value !== null,
  );

  /** Секция снятия хитов: уровень падает, показываем что вернётся из максимума. */
  const isLevelDownSectionVisible = computed(() => levelsLost.value > 0);

  const constitutionModifier = computed(() =>
    getModifier(character.value.abilities.constitution),
  );

  const formattedConstitutionModifier = computed(() =>
    getFormattedModifier(character.value.abilities.constitution),
  );

  const constitutionHint = computed(
    () =>
      `${LEVEL_UP_HIT_POINTS_LABELS.constitutionTitle}: ${formattedConstitutionModifier.value} ${LEVEL_UP_HIT_POINTS_LABELS.perLevelSuffix}`,
  );

  const hitDieLabel = computed(() =>
    classDie.value !== null ? getHitDieLabel(classDie.value) : '',
  );

  const averageGainPerLevel = computed(() =>
    classDie.value !== null
      ? getLevelHitPointsGain(
          getHitDieAverage(classDie.value),
          constitutionModifier.value,
        )
      : 0,
  );

  const maxGainPerLevel = computed(() =>
    classDie.value !== null
      ? getLevelHitPointsGain(classDie.value, constitutionModifier.value)
      : 0,
  );

  const gainMode = ref<HitPointsGainMode>('average');

  const gainModeOptions = computed(() => [
    {
      value: 'average',
      label: HIT_POINTS_GAIN_MODE_LABELS.average,
      description: `+${averageGainPerLevel.value} ${LEVEL_UP_HIT_POINTS_LABELS.hitPointsPerLevelSuffix}`,
    },
    {
      value: 'roll',
      label: HIT_POINTS_GAIN_MODE_LABELS.roll,
      description: `1${hitDieLabel.value} ${LEVEL_UP_HIT_POINTS_LABELS.rollModeDescriptionSuffix}`,
    },
    {
      value: 'max',
      label: HIT_POINTS_GAIN_MODE_LABELS.max,
      description: `+${maxGainPerLevel.value} ${LEVEL_UP_HIT_POINTS_LABELS.hitPointsPerLevelSuffix}`,
    },
  ]);

  const rollResults = ref<HitDieRollResult[]>([]);

  // Смена целевого уровня меняет количество бросаемых костей — прежние броски
  // устаревают.
  watch(draftLevel, () => {
    rollResults.value = [];
  });

  /**
   * Прирост максимума хитов за каждый взятый уровень по порядку. Лист хранит
   * его поуровнево, чтобы снижение уровня вернуло ровно эти значения, поэтому
   * броски не схлопываются в сумму.
   */
  const hitPointsGains = computed<number[]>(() => {
    if (!isHitPointsSectionVisible.value) {
      return [];
    }

    if (gainMode.value === 'roll') {
      return rollResults.value.map((result) => result.restored);
    }

    const gainPerLevel =
      gainMode.value === 'max'
        ? maxGainPerLevel.value
        : averageGainPerLevel.value;

    return Array.from({ length: levelsGained.value }, () => gainPerLevel);
  });

  const hitPointsGain = computed(() =>
    hitPointsGains.value.reduce((total, gain) => total + gain, 0),
  );

  /** Сколько максимума вернут снимаемые уровни; 0 — прирост за них не записан. */
  const hitPointsLoss = computed(() =>
    isLevelDownSectionVisible.value
      ? getLevelHitPointsLoss(character.value.health, draftLevel.value)
      : 0,
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

  /** В режиме броска применять нечего, пока кости не брошены. */
  const isRollPending = computed(
    () =>
      isHitPointsSectionVisible.value
      && gainMode.value === 'roll'
      && rollResults.value.length === 0,
  );

  const isRollControlVisible = computed(() => gainMode.value === 'roll');

  const isRollJournalVisible = computed(
    () => gainMode.value === 'roll' && rollResults.value.length > 0,
  );

  const rollButtonLabel = computed(() => {
    const action =
      rollResults.value.length > 0
        ? LEVEL_UP_HIT_POINTS_LABELS.reroll
        : LEVEL_UP_HIT_POINTS_LABELS.roll;

    return `${action} ${levelsGained.value}${hitDieLabel.value}`;
  });

  const maxHitPointsChangeLabel = computed(
    () =>
      `${character.value.health.max} → ${character.value.health.max + hitPointsGain.value}`,
  );

  /**
   * Бросок костей новых уровней: каждая кость катится отдельно, потому что
   * минимум прироста (один хит) правила применяют к каждому уровню, а игрок
   * видит результат каждого броска.
   */
  function handleRoll(): void {
    const die = classDie.value;

    if (die === null) {
      return;
    }

    rollResults.value = Array.from(
      { length: levelsGained.value },
      (): HitDieRollResult => {
        const rolled = rollValue(getHitDieFormula(die));

        return {
          id: crypto.randomUUID(),
          label: getHitDieLabel(die),
          rolled,
          formattedModifier: formattedConstitutionModifier.value,
          restored: getLevelHitPointsGain(rolled, constitutionModifier.value),
        };
      },
    );
  }

  function handleApply() {
    if (isRollPending.value) {
      return;
    }

    setProgress(draftLevel.value, totalExperience.value, hitPointsGains.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Опыт и уровень">
    <template #body>
      <div class="flex flex-col gap-3">
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

          <span class="font-bold text-highlighted">{{ totalExperience }}</span>
        </div>

        <template v-if="isHitPointsSectionVisible">
          <USeparator class="my-1" />

          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-baseline justify-between gap-x-2">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ LEVEL_UP_HIT_POINTS_LABELS.title }}
              </span>

              <span class="text-xs text-dimmed">
                {{ constitutionHint }}
              </span>
            </div>

            <URadioGroup
              v-model="gainMode"
              :items="gainModeOptions"
              variant="list"
              color="warning"
            />

            <UButton
              v-if="isRollControlVisible"
              :label="rollButtonLabel"
              icon="ttg:dice-outline-d20"
              color="primary"
              variant="soft"
              block
              @click.left.exact.prevent="handleRoll"
            />

            <div
              v-if="isRollJournalVisible"
              class="flex flex-col gap-1 rounded-lg bg-elevated/40 p-3"
            >
              <div
                v-for="result in rollResults"
                :key="result.id"
                class="flex items-baseline justify-between gap-2 text-sm"
              >
                <span class="text-muted">
                  {{ result.label }}: {{ result.rolled }}
                  {{ result.formattedModifier }}
                </span>

                <span class="font-bold text-success">
                  +{{ result.restored }}
                </span>
              </div>
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
                {{ maxHitPointsChangeLabel }}
              </span>
            </div>

            <span class="text-xs text-dimmed">
              {{ LEVEL_UP_HIT_POINTS_LABELS.growthHint }}
            </span>
          </div>
        </template>

        <template v-else-if="isLevelDownSectionVisible">
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
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          :disabled="isRollPending"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
