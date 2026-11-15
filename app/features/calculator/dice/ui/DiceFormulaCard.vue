<script setup lang="ts">
  import type { RollToggleKey } from '../model';

  import { HomeEyebrow } from '~home/ui-kit';

  import { useDiceCalculator } from '../composables';
  import {
    DICE_FORMULA_LABELS,
    DICE_FORMULA_MAX_LENGTH,
    DICE_ICONS,
    DICE_PRESETS,
    getAddDieTitle,
    getQuickDieLabel,
    MODIFIER_STEP,
    QUICK_DICE_SIDES,
    ROLL_DAMAGE_TOGGLES,
    ROLL_MODES,
    ROLL_TOGGLE_COLORS,
    ROLL_TOGGLE_HINTS,
    ROLL_TOGGLE_LABELS,
  } from '../model';
  import DiceFaceIcon from './DiceFaceIcon.vue';
  import DiceOrnatePanel from './DiceOrnatePanel.vue';
  import DicePresetPrompt from './DicePresetPrompt.vue';

  const {
    formula,
    errorMessage,
    hasError,
    rollMode,
    isCriticalDamage,
    hasResistance,
    isFormulaValid,
    isRollModeAvailable,
    isAnalysisOpen,

    roll,
    setAndRoll,
    toggleMode,
    toggleCriticalDamage,
    toggleResistance,
    toggleAnalysis,
    addDie,
    adjustModifier,
    dropLast,
    reset,
  } = useDiceCalculator();

  const quickDice = computed(() =>
    QUICK_DICE_SIDES.map((sides) => ({
      sides,
      label: getQuickDieLabel(sides),
      title: getAddDieTitle(sides),
    })),
  );

  const activeToggles = computed<Readonly<Record<RollToggleKey, boolean>>>(
    () => ({
      advantage: rollMode.value === 'advantage',
      disadvantage: rollMode.value === 'disadvantage',
      critical: isCriticalDamage.value,
      resistance: hasResistance.value,
    }),
  );

  // Крит и сопротивление применимы к любой формуле, режимы — только к той,
  // где есть одиночная d20; порядок держит первые на месте, пока вторые
  // появляются и исчезают.
  const toggleKeys = computed<ReadonlyArray<RollToggleKey>>(() => [
    ...(isFormulaValid.value ? ROLL_DAMAGE_TOGGLES : []),
    ...(isRollModeAvailable.value ? ROLL_MODES : []),
  ]);

  const toggleButtons = computed(() =>
    toggleKeys.value.map((key) => ({
      key,
      label: ROLL_TOGGLE_LABELS[key],
      hint: ROLL_TOGGLE_HINTS[key],
      color: ROLL_TOGGLE_COLORS[key],
      active: activeToggles.value[key],
    })),
  );

  /**
   * Переключает кнопку режима, крита или сопротивления.
   *
   * @param key - Переключатель, по которому нажали
   */
  function handleToggle(key: RollToggleKey): void {
    if (key === 'critical') {
      toggleCriticalDamage();

      return;
    }

    if (key === 'resistance') {
      toggleResistance();

      return;
    }

    toggleMode(key);
  }

  const inputColor = computed(() => (hasError.value ? 'error' : 'primary'));

  const analyzeVariant = computed(() =>
    isAnalysisOpen.value ? 'soft' : 'outline',
  );

  /** Прибавляет шаг к модификатору в конце формулы. */
  function handleIncrease(): void {
    adjustModifier(MODIFIER_STEP);
  }

  /** Вычитает шаг из модификатора в конце формулы. */
  function handleDecrease(): void {
    adjustModifier(-MODIFIER_STEP);
  }
</script>

<template>
  <DiceOrnatePanel
    :label="DICE_FORMULA_LABELS.section"
    :icon="DICE_ICONS.formula"
    :aria-label="DICE_FORMULA_LABELS.section"
  >
    <div class="flex flex-col gap-1.5">
      <UInput
        v-model="formula"
        size="xl"
        class="w-full"
        :placeholder="DICE_FORMULA_LABELS.placeholder"
        autocomplete="off"
        spellcheck="false"
        :maxlength="DICE_FORMULA_MAX_LENGTH"
        :color="inputColor"
        :aria-label="DICE_FORMULA_LABELS.section"
        :ui="{ base: 'font-mono', trailing: 'pe-1' }"
        @keydown.enter="roll"
      >
        <template
          v-if="formula"
          #trailing
        >
          <UButton
            :icon="DICE_ICONS.clear"
            variant="link"
            color="neutral"
            size="sm"
            :aria-label="DICE_FORMULA_LABELS.clear"
            :title="DICE_FORMULA_LABELS.clear"
            @click.left.exact.prevent="reset"
          />
        </template>
      </UInput>

      <p
        class="min-h-5 text-sm text-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="flex gap-2">
        <UButton
          :icon="DICE_ICONS.roll"
          :label="DICE_FORMULA_LABELS.roll"
          color="primary"
          size="xl"
          class="flex-1 justify-center font-semibold"
          :class="$style.roll"
          @click.left.exact.prevent="roll"
        />

        <UButton
          :icon="DICE_ICONS.analysis"
          :label="DICE_FORMULA_LABELS.analyze"
          color="primary"
          size="xl"
          :variant="analyzeVariant"
          :aria-pressed="isAnalysisOpen"
          @click.left.exact.prevent="toggleAnalysis"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <HomeEyebrow :label="DICE_FORMULA_LABELS.diceCaption" />

      <!-- Клавиатура костей: семь костей и три правки формулы дают ровно
        десять клавиш — два ряда по пять на телефоне и в колонке, один ряд
        на планшете, где панель идёт во всю ширину -->
      <div
        class="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2 lg:grid-cols-5"
        role="group"
        :aria-label="DICE_FORMULA_LABELS.diceGroup"
      >
        <UButton
          v-for="die in quickDice"
          :key="die.sides"
          color="primary"
          variant="soft"
          class="flex-col justify-center gap-1 px-1 py-2 font-mono"
          :class="$style.key"
          :title="die.title"
          @click.left.exact.prevent="addDie(die.sides)"
        >
          <DiceFaceIcon
            :sides="die.sides"
            class="size-6"
          />

          {{ die.label }}
        </UButton>

        <UButton
          color="neutral"
          variant="soft"
          class="justify-center px-1 font-mono text-base"
          :class="$style.key"
          :label="DICE_FORMULA_LABELS.increaseModifierButton"
          :title="DICE_FORMULA_LABELS.increaseModifier"
          @click.left.exact.prevent="handleIncrease"
        />

        <UButton
          color="neutral"
          variant="soft"
          class="justify-center px-1 font-mono text-base"
          :class="$style.key"
          :label="DICE_FORMULA_LABELS.decreaseModifierButton"
          :title="DICE_FORMULA_LABELS.decreaseModifier"
          @click.left.exact.prevent="handleDecrease"
        />

        <UButton
          color="neutral"
          variant="soft"
          :icon="DICE_ICONS.dropLast"
          class="justify-center px-1"
          :class="$style.key"
          :title="DICE_FORMULA_LABELS.dropLast"
          :aria-label="DICE_FORMULA_LABELS.dropLast"
          @click.left.exact.prevent="dropLast"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <HomeEyebrow :label="DICE_FORMULA_LABELS.presetCaption" />

      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        :aria-label="DICE_FORMULA_LABELS.presetGroup"
      >
        <template
          v-for="preset in DICE_PRESETS"
          :key="preset.id"
        >
          <DicePresetPrompt
            v-if="preset.prompt"
            :preset="preset"
            :prompt="preset.prompt"
            @submit="setAndRoll"
          />

          <UButton
            v-else
            color="neutral"
            variant="outline"
            size="sm"
            class="rounded-full"
            :title="preset.formula"
            @click.left.exact.prevent="setAndRoll(preset.formula)"
          >
            <span class="font-semibold text-default">{{ preset.label }}</span>

            <span
              v-if="preset.hint"
              class="font-mono text-muted"
            >
              {{ preset.hint }}
            </span>
          </UButton>
        </template>
      </div>
    </div>

    <!-- Переключатели живут отдельной группой: режимы появляются и исчезают
      вместе с d20 в формуле и не должны сдвигать ни кости, ни заготовки -->
    <div
      v-if="toggleButtons.length"
      class="flex flex-col gap-2"
    >
      <HomeEyebrow :label="DICE_FORMULA_LABELS.toggleCaption" />

      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        :aria-label="DICE_FORMULA_LABELS.toggleGroup"
      >
        <button
          v-for="button in toggleButtons"
          :key="button.key"
          type="button"
          class="rounded-full px-3 py-1 text-sm font-semibold ring ring-accented transition-colors"
          :class="$style.toggle"
          :style="{ '--toggle-color': button.color }"
          :title="button.hint"
          :aria-pressed="button.active"
          @click.left.exact.prevent="handleToggle(button.key)"
        >
          {{ button.label }}
        </button>
      </div>
    </div>
  </DiceOrnatePanel>
</template>

<style module lang="scss">
  /* Главная кнопка страницы: мягкое свечение акцентом, чтобы взгляд находил
     её раньше клавиатуры костей */
  .roll {
    box-shadow: 0 4px 18px -4px
      color-mix(in oklab, var(--ui-primary) 55%, transparent);
    transition:
      transform 0.15s ease-out,
      box-shadow 0.15s ease-out;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 22px -4px
        color-mix(in oklab, var(--ui-primary) 70%, transparent);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* Клавиша клавиатуры костей: одной высоты у костей и у правок формулы */
  .key {
    min-height: 3.5rem;
    transition:
      transform 0.15s ease-out,
      background-color 0.15s ease-out;

    &:hover {
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0) scale(0.96);
    }
  }

  /* Цвет включённого переключателя приходит из `--toggle-color`: он свой
     у каждой кнопки, поэтому свечение описано один раз, а не по разу на цвет */
  .toggle {
    color: var(--ui-text-muted);

    &:hover {
      color: var(--ui-text-highlighted);
    }

    &[aria-pressed='true'] {
      color: var(--toggle-color);
      animation: glow 1.8s ease-in-out infinite;
    }
  }

  @keyframes glow {
    0%,
    100% {
      box-shadow:
        inset 0 0 0 1px var(--toggle-color),
        0 0 3px 0 color-mix(in oklab, var(--toggle-color) 40%, transparent);
    }

    50% {
      box-shadow:
        inset 0 0 0 1.5px var(--toggle-color),
        0 0 14px 1px color-mix(in oklab, var(--toggle-color) 70%, transparent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .roll,
    .key {
      transition: none;

      &:hover,
      &:active {
        transform: none;
      }
    }

    .toggle[aria-pressed='true'] {
      box-shadow:
        inset 0 0 0 1.5px var(--toggle-color),
        0 0 8px 0 color-mix(in oklab, var(--toggle-color) 55%, transparent);
      animation: none;
    }
  }
</style>
