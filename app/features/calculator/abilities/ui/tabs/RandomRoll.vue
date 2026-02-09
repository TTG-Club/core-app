<script setup lang="ts">
  import { useDiceRoller } from '~dice-roller/composables/useDiceRoller';
  import { extractDiceRollDetails } from '~dice-roller/utils';

  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    AbilityKey,
    isAbilityKey,
  } from '~/shared/types';

  import {
    RANDOM_ROLL_COUNT,
    RANDOM_ROLL_FORMULA,
    RANDOM_ROLL_MAX_RESULT,
    ZERO_SCORES,
  } from '../../model';

  import { DiceSpinner } from './components';

  import type { DiceRollItem } from '~dice-roller/types';

  import type { RandomRollState } from '../../model';

  const state = defineModel<RandomRollState>('state', { required: true });

  const { roll } = useDiceRoller();
  const isAnimating = ref(false);

  const localState = ref<RandomRollState>({
    scores: { ...ZERO_SCORES },
    isComplete: false,
    rolls: [],
    assignments: {},
  });

  const hasRolled = ref(false);

  const currentDice = ref<DiceRollItem[][]>(
    Array.from<DiceRollItem[]>({ length: RANDOM_ROLL_COUNT }).fill([]),
  );

  const animationCompleted = ref<boolean[]>(
    Array.from({ length: RANDOM_ROLL_COUNT }, () => true),
  );

  watch(
    state,
    (newVal) => {
      localState.value = { ...newVal };

      if (newVal.dice) {
        currentDice.value = newVal.dice;
      }

      if (newVal.rolls.length > 0) {
        hasRolled.value = true;
      }
    },
    { deep: true, immediate: true },
  );

  const totalSum = computed(() =>
    localState.value.rolls.reduce((sum, val) => sum + val, 0),
  );

  function onAnimationComplete(index: number) {
    animationCompleted.value[index] = true;

    if (animationCompleted.value.every((completed) => completed)) {
      isAnimating.value = false;
    }
  }

  function rollDice() {
    const results: number[] = [];
    const diceDetails: DiceRollItem[][] = [];

    for (let i = 0; i < RANDOM_ROLL_COUNT; i++) {
      const rollResult = roll(RANDOM_ROLL_FORMULA);
      const [details] = extractDiceRollDetails(rollResult);
      const rolls = details?.rolls || [];

      results.push(rollResult.value);
      diceDetails.push(rolls);
    }

    const paired = results.map((result, i) => ({
      result,
      dice: diceDetails[i],
    }));

    paired.sort((a, b) => b.result - a.result);

    const sortedResults = paired.map((pair) => pair.result);
    const sortedDice = paired.map((pair) => pair.dice ?? []);

    const newScores = { ...localState.value.scores };

    for (const key of Object.values(AbilityKey)) {
      newScores[key] = 0;
    }

    const newState: RandomRollState = {
      scores: newScores,
      isComplete: false,
      rolls: sortedResults,
      dice: sortedDice,
      assignments: {},
    };

    localState.value = newState;
    currentDice.value = sortedDice;
    state.value = newState;

    hasRolled.value = true;
    isAnimating.value = true;

    animationCompleted.value = Array.from(
      { length: RANDOM_ROLL_COUNT },
      () => false,
    );
  }

  const abilityOptions = computed(() => {
    return [
      { label: 'Не назначено', value: null },
      ...ABILITY_KEYS.map((key) => ({
        label: ABILITY_LABELS[key],
        value: key,
      })),
    ];
  });

  function updateAssignment(rollIndex: number, ability: AbilityKey | null) {
    const newAssignments: Record<number, AbilityKey | null> = {};

    for (const [idxStr, assignedAbility] of Object.entries(
      localState.value.assignments,
    )) {
      const idx = Number(idxStr);

      if (idx === rollIndex) {
        continue;
      }

      if (ability !== null && assignedAbility === ability) {
        continue;
      }

      newAssignments[idx] = assignedAbility;
    }

    if (ability !== null) {
      newAssignments[rollIndex] = ability;
    }

    const newScores = { ...localState.value.scores };

    for (const key of Object.values(AbilityKey)) {
      newScores[key] = 0;
    }

    for (const [idxStr, assignedAbility] of Object.entries(newAssignments)) {
      const idx = Number(idxStr);

      if (assignedAbility) {
        const rollValue = localState.value.rolls[idx];

        if (typeof rollValue === 'number') {
          newScores[assignedAbility] = rollValue;
        }
      }
    }

    const newState = {
      ...localState.value,
      assignments: newAssignments,
      scores: newScores,
    };

    localState.value = newState;
    state.value = newState;
  }

  function handleAssignmentUpdate(index: number, value: unknown) {
    updateAssignment(index, isAbilityKey(value) ? value : null);
  }
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex items-center justify-between">
      <div class="text-sm text-secondary">
        <template v-if="!hasRolled">
          Сначала бросьте <span class="font-mono">4к6</span> шесть раз, затем
          распределите результаты по характеристикам.
        </template>

        <template v-else>
          Распределите результаты по характеристикам.
          <span
            v-if="totalSum > 0"
            class="ml-2 inline-flex items-center gap-1 font-semibold text-primary"
          >
            Общая сумма:
            <span v-if="!isAnimating">
              {{ totalSum }}
            </span>

            <USkeleton
              v-else
              class="h-4 w-8 bg-primary/50"
            />
          </span>
        </template>
      </div>

      <UButton
        size="sm"
        @click="rollDice"
      >
        Бросить кубы
      </UButton>
    </div>

    <div
      v-if="localState.rolls.length > 0"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="(rollValue, index) in localState.rolls"
        :key="index"
        class="bg-card flex flex-col gap-3 rounded-xl border border-default p-3 transition-colors"
        :class="{
          'border-success bg-success/5':
            !isAnimating && rollValue === RANDOM_ROLL_MAX_RESULT,
        }"
      >
        <div class="flex items-center justify-between">
          <div class="pl-2 text-2xl font-bold">
            <USkeleton
              v-if="isAnimating"
              class="h-7 w-8"
            />

            <span v-else>{{ rollValue }}</span>
          </div>

          <USelect
            v-if="!isAnimating"
            :model-value="localState.assignments[index] ?? null"
            :items="abilityOptions"
            class="w-40"
            placeholder="Назначить..."
            @update:model-value="handleAssignmentUpdate(index, $event)"
          />

          <USkeleton
            v-else
            class="h-8 w-40"
          />
        </div>

        <div class="flex items-center justify-center gap-4 pt-2">
          <DiceSpinner
            :values="currentDice[index] ?? []"
            @complete="onAnimationComplete(index)"
          />
        </div>
      </div>
    </div>

    <div
      v-else
      class="py-8 text-center text-muted"
    >
      Нажмите "Бросить кубы" чтобы начать
    </div>
  </div>
</template>
