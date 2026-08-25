<script setup lang="ts">
  import type { RollToggleKey } from '../model';

  import { useDiceCalculator } from '../composables';
  import {
    DICE_FORMULA_LABELS,
    DICE_FORMULA_MAX_LENGTH,
    DICE_PRESETS,
    getAddDieTitle,
    MODIFIER_STEP,
    PERCENTILE_DIE_SIDES,
    QUICK_DICE_SIDES,
    ROLL_DAMAGE_TOGGLES,
    ROLL_MODES,
    ROLL_TOGGLE_COLORS,
    ROLL_TOGGLE_HINTS,
    ROLL_TOGGLE_LABELS,
  } from '../model';
  import DiceFaceIcon from './DiceFaceIcon.vue';
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
      label: sides === PERCENTILE_DIE_SIDES ? 'd%' : `d${sides}`,
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

  const analyzeVariant = computed(() =>
    isAnalysisOpen.value ? 'soft' : 'outline',
  );

  function handleIncrease(): void {
    adjustModifier(MODIFIER_STEP);
  }

  function handleDecrease(): void {
    adjustModifier(-MODIFIER_STEP);
  }
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    :aria-label="DICE_FORMULA_LABELS.section"
  >
    <div class="flex flex-wrap items-center gap-2">
      <UInput
        v-model="formula"
        class="min-w-56 flex-1"
        :placeholder="DICE_FORMULA_LABELS.placeholder"
        autocomplete="off"
        spellcheck="false"
        :maxlength="DICE_FORMULA_MAX_LENGTH"
        :color="hasError ? 'error' : 'primary'"
        :aria-label="DICE_FORMULA_LABELS.section"
        :ui="{ trailing: 'pe-0.5' }"
        @keydown.enter="roll"
      >
        <template
          v-if="formula"
          #trailing
        >
          <UButton
            icon="tabler:x"
            variant="link"
            color="neutral"
            size="sm"
            :aria-label="DICE_FORMULA_LABELS.clear"
            :title="DICE_FORMULA_LABELS.clear"
            @click.left.exact.prevent="reset"
          />
        </template>
      </UInput>

      <UButton
        icon="ttg:dice-d20"
        :label="DICE_FORMULA_LABELS.roll"
        color="primary"
        @click.left.exact.prevent="roll"
      />

      <UButton
        :label="DICE_FORMULA_LABELS.analyze"
        color="primary"
        :variant="analyzeVariant"
        :aria-pressed="isAnalysisOpen"
        @click.left.exact.prevent="toggleAnalysis"
      />
    </div>

    <p
      class="min-h-5 text-sm text-error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <div
      class="flex flex-wrap items-center gap-2"
      :aria-label="DICE_FORMULA_LABELS.diceGroup"
    >
      <UButton
        v-for="die in quickDice"
        :key="die.sides"
        color="primary"
        variant="soft"
        :title="die.title"
        @click.left.exact.prevent="addDie(die.sides)"
      >
        <DiceFaceIcon :sides="die.sides" />

        {{ die.label }}
      </UButton>

      <div
        class="mx-1 h-6 w-px bg-accented"
        aria-hidden="true"
      />

      <UButton
        color="neutral"
        variant="soft"
        label="+1"
        :title="DICE_FORMULA_LABELS.increaseModifier"
        @click.left.exact.prevent="handleIncrease"
      />

      <UButton
        color="neutral"
        variant="soft"
        label="−1"
        :title="DICE_FORMULA_LABELS.decreaseModifier"
        @click.left.exact.prevent="handleDecrease"
      />

      <UButton
        color="neutral"
        variant="soft"
        icon="tabler:backspace"
        :title="DICE_FORMULA_LABELS.dropLast"
        :aria-label="DICE_FORMULA_LABELS.dropLast"
        @click.left.exact.prevent="dropLast"
      />
    </div>

    <div
      class="flex flex-wrap items-center gap-2"
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
            class="text-muted"
          >
            · {{ preset.hint }}
          </span>
        </UButton>
      </template>

      <!-- Переключатели идут последними: режимы появляются и исчезают вместе
        с d20 в формуле, и стоя первыми сдвигали бы пресеты на каждом наборе -->
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
  </section>
</template>

<style module lang="scss">
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
    .toggle[aria-pressed='true'] {
      box-shadow:
        inset 0 0 0 1.5px var(--toggle-color),
        0 0 8px 0 color-mix(in oklab, var(--toggle-color) 55%, transparent);
      animation: none;
    }
  }
</style>
