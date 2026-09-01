<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import type {
    AbilityImprovementMode,
    AbilityKey,
    CharacterAbilities,
    FeatSelectOption,
  } from '../../model';

  import {
    ABILITY_IMPROVEMENT_STEP,
    ABILITY_IMPROVEMENT_STEP_LABELS,
    ABILITY_LABELS,
    ABILITY_ORDER,
    canIncreaseAbilityImprovement,
    getAbilityImprovementRequiredPoints,
    getAbilityImprovementSpent,
  } from '../../model';
  import SheetLevelUpFeatChoice from './SheetLevelUpFeatChoice.vue';

  /** Кнопка переключателя режима: подпись и её вид в текущем режиме. */
  interface ModeButton {
    mode: AbilityImprovementMode;
    label: string;
    color: ButtonProps['color'];
    variant: ButtonProps['variant'];
  }

  const {
    title = ABILITY_IMPROVEMENT_STEP_LABELS.title,
    badgeLabel = '',
    mode,
    increases,
    scores,
    featOptions,
    selectedFeat = null,
    featAbilities,
    isFeatsLoading = false,
    hasFeatsError = false,
  } = defineProps<{
    /** Подпись выбора из записи умения; пусто — общее «Повышение характеристик». */
    title?: string;

    /** Бейдж источника и уровня («Воин · 4 ур.»); пусто — бейджа нет. */
    badgeLabel?: string;

    /** Режим повышения: прибавки к характеристикам или черта вместо них. */
    mode: AbilityImprovementMode;

    /** Разложенные прибавки по характеристикам. */
    increases: Partial<Record<AbilityKey, number>>;

    /** Итоговые характеристики персонажа — от них считается предел. */
    scores: CharacterAbilities;

    /** Черты, доступные выбору черты вместо повышения. */
    featOptions: FeatSelectOption[];

    /** Выбранная черта; null — выбора ещё не было. */
    selectedFeat?: FeatSelectOption | null;

    /** Выбранные характеристики по слотам прибавок выбранной черты. */
    featAbilities: (AbilityKey | null)[];

    isFeatsLoading?: boolean;

    /** Каталог черт загрузить не удалось — выбор черты недоступен. */
    hasFeatsError?: boolean;
  }>();

  const emit = defineEmits<{
    'update:mode': [mode: AbilityImprovementMode];
    'step': [payload: { ability: AbilityKey; delta: number }];
    'reset': [];
    'update:feat': [featUrl: string];
    'update:feat-ability': [
      payload: { slot: number; ability: AbilityKey | null },
    ];
  }>();

  const isAbilitiesMode = computed(() => mode === 'abilities');

  const spentPoints = computed(() => getAbilityImprovementSpent(increases));

  const requiredPoints = computed(() =>
    getAbilityImprovementRequiredPoints(scores),
  );

  const remainingPoints = computed(
    () => requiredPoints.value - spentPoints.value,
  );

  /** Поднимать нечего: все характеристики уже на пределе — остаётся черта. */
  const isMaxedOut = computed(() => requiredPoints.value === 0);

  const remainingClass = computed(() =>
    remainingPoints.value > 0 ? 'text-warning' : 'text-success',
  );

  /**
   * Плитки характеристик: у каждой записанное значение, значение после прибавки
   * и доступность шагов ± — иначе кнопки «упирались» бы в предел молча.
   */
  const abilityTiles = computed(() =>
    ABILITY_ORDER.map((key) => {
      const increase = increases[key] ?? 0;
      const score = scores[key];

      return {
        key,
        label: ABILITY_LABELS[key],
        score,
        increase,
        nextScore: score + increase,
        decreaseLabel: `${ABILITY_IMPROVEMENT_STEP_LABELS.decrease}: ${ABILITY_LABELS[key]}`,
        increaseLabel: `${ABILITY_IMPROVEMENT_STEP_LABELS.increase}: ${ABILITY_LABELS[key]}`,
        isDecreaseDisabled: increase <= 0,
        isIncreaseDisabled: !canIncreaseAbilityImprovement(
          scores,
          increases,
          key,
        ),
      };
    }),
  );

  const modeButtons = computed<ModeButton[]>(() => [
    {
      mode: 'abilities',
      label: ABILITY_IMPROVEMENT_STEP_LABELS.modeAbilities,
      color: isAbilitiesMode.value ? 'primary' : 'neutral',
      variant: isAbilitiesMode.value ? 'solid' : 'outline',
    },
    {
      mode: 'feat',
      label: ABILITY_IMPROVEMENT_STEP_LABELS.modeFeat,
      color: isAbilitiesMode.value ? 'neutral' : 'primary',
      variant: isAbilitiesMode.value ? 'outline' : 'solid',
    },
  ]);

  /**
   * Переключает режим повышения.
   *
   * @param next выбранный режим.
   */
  function handleMode(next: AbilityImprovementMode) {
    if (next !== mode) {
      emit('update:mode', next);
    }
  }

  /**
   * Убавляет прибавку характеристики на шаг.
   *
   * @param ability ключ характеристики.
   */
  function handleDecrease(ability: AbilityKey) {
    emit('step', { ability, delta: -ABILITY_IMPROVEMENT_STEP });
  }

  /**
   * Добавляет прибавку характеристике на шаг.
   *
   * @param ability ключ характеристики.
   */
  function handleIncrease(ability: AbilityKey) {
    emit('step', { ability, delta: ABILITY_IMPROVEMENT_STEP });
  }

  function handleReset() {
    emit('reset');
  }

  /**
   * Передаёт наверх выбранную черту.
   *
   * @param featUrl url черты; '' — выбор снят.
   */
  function handleFeat(featUrl: string) {
    emit('update:feat', featUrl);
  }

  /**
   * Передаёт наверх выбранную характеристику слота прибавки черты.
   *
   * @param payload номер слота и выбранная характеристика.
   * @param payload.slot номер слота прибавки (с нуля).
   * @param payload.ability выбранная характеристика; null — выбор снят.
   */
  function handleFeatAbility(payload: {
    slot: number;
    ability: AbilityKey | null;
  }) {
    emit('update:feat-ability', payload);
  }
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm font-bold text-highlighted">{{ title }}</span>

      <UBadge
        v-if="badgeLabel"
        size="md"
        color="neutral"
        variant="subtle"
        class="shrink-0"
      >
        {{ badgeLabel }}
      </UBadge>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="button in modeButtons"
        :key="button.mode"
        size="sm"
        :color="button.color"
        :variant="button.variant"
        :label="button.label"
        @click.left.exact.prevent="handleMode(button.mode)"
      />
    </div>

    <div
      v-if="isAbilitiesMode"
      class="flex flex-col gap-2"
    >
      <div class="flex flex-wrap items-center justify-between gap-x-2">
        <span class="text-xs text-muted">
          {{ ABILITY_IMPROVEMENT_STEP_LABELS.distributeHint }}
        </span>

        <div class="flex items-center gap-2">
          <span
            class="text-sm font-bold"
            :class="remainingClass"
          >
            {{ ABILITY_IMPROVEMENT_STEP_LABELS.pointsRemaining }}:
            {{ remainingPoints }}
          </span>

          <UTooltip
            v-if="spentPoints > 0"
            :text="ABILITY_IMPROVEMENT_STEP_LABELS.reset"
          >
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="tabler:refresh"
              square
              :aria-label="ABILITY_IMPROVEMENT_STEP_LABELS.reset"
              @click.left.exact.prevent="handleReset"
            />
          </UTooltip>
        </div>
      </div>

      <span
        v-if="isMaxedOut"
        class="text-xs text-warning"
      >
        {{ ABILITY_IMPROVEMENT_STEP_LABELS.maxedHint }}
      </span>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div
          v-for="tile in abilityTiles"
          :key="tile.key"
          class="flex items-center justify-between gap-2 rounded-md border border-default/50 bg-default px-2.5 py-1.5"
        >
          <div class="flex min-w-0 items-baseline gap-1.5">
            <span class="truncate text-sm font-medium text-toned">
              {{ tile.label }}
            </span>

            <span class="text-base font-bold text-highlighted">
              {{ tile.score }}
            </span>

            <template v-if="tile.increase > 0">
              <span class="text-sm text-dimmed">→</span>

              <span class="text-base font-bold text-success">
                {{ tile.nextScore }}
              </span>
            </template>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              icon="tabler:minus"
              square
              :disabled="tile.isDecreaseDisabled"
              :aria-label="tile.decreaseLabel"
              @click.left.exact.prevent="handleDecrease(tile.key)"
            />

            <span class="w-4 text-center text-xs font-bold text-highlighted">
              {{ tile.increase }}
            </span>

            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              icon="tabler:plus"
              square
              :disabled="tile.isIncreaseDisabled"
              :aria-label="tile.increaseLabel"
              @click.left.exact.prevent="handleIncrease(tile.key)"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col gap-2"
    >
      <span class="text-xs text-dimmed">
        {{ ABILITY_IMPROVEMENT_STEP_LABELS.featHint }}
      </span>

      <SheetLevelUpFeatChoice
        :options="featOptions"
        :selected="selectedFeat"
        :abilities="featAbilities"
        :scores="scores"
        :is-loading="isFeatsLoading"
        :has-error="hasFeatsError"
        @update:feat="handleFeat"
        @update:ability="handleFeatAbility"
      />
    </div>
  </div>
</template>
