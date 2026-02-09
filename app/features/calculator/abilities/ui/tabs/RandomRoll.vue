<script setup lang="ts">
  import { useDiceRoller } from '~/features/dice-roller/composables/useDiceRoller';
  import { extractDiceRollDetails } from '~/features/dice-roller/utils';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    AbilityKey,
    isAbilityKey,
  } from '~/shared/types';

  import DiceSpinner from './components/DiceSpinner.vue';

  import type { DiceRollItem } from '~/features/dice-roller/types';

  import type { RandomRollState } from '../../model/types';

  const props = defineProps<{
    state: RandomRollState;
  }>();

  const emit = defineEmits<{
    (e: 'update:state', value: RandomRollState): void;
  }>();

  const { roll } = useDiceRoller();
  const isAnimating = ref(false);

  const localState = ref<RandomRollState>({ ...props.state });
  const hasRolled = ref(props.state.rolls.length > 0);

  // Initialize dice if they exist in state, otherwise placeholder
  const currentDice = ref<DiceRollItem[][]>(
    props.state.dice ?? Array.from<DiceRollItem[]>({ length: 6 }).fill([]),
  );

  // Store boolean flags for animation completion of each block
  const animationCompleted = ref<boolean[]>(
    Array.from({ length: 6 }, () => true),
  );

  watch(
    () => props.state,
    (newVal) => {
      localState.value = { ...newVal };

      if (newVal.dice) {
        currentDice.value = newVal.dice;
      }

      if (newVal.rolls.length > 0) {
        hasRolled.value = true;
      }
    },
    { deep: true },
  );

  const totalSum = computed(() =>
    localState.value.rolls.reduce((sum, val) => sum + val, 0),
  );

  function onAnimationComplete(index: number) {
    animationCompleted.value[index] = true;

    // If all animations are complete, set global isAnimating to false
    if (animationCompleted.value.every((completed) => completed)) {
      isAnimating.value = false;
    }
  }

  function rollDice() {
    const results: number[] = [];
    const diceDetails: DiceRollItem[][] = [];

    for (let i = 0; i < 6; i++) {
      const rollResult = roll('4d6dl1');
      const [details] = extractDiceRollDetails(rollResult);
      const rolls = details?.rolls || [];

      results.push(rollResult.value);
      diceDetails.push(rolls);
    }

    // Sort results descending
    // We also need to sort diceDetails to match the sorted results
    // Create pairs of [result, dice]
    const paired = results.map((res, i) => ({
      res,
      dice: diceDetails[i],
    }));

    paired.sort((a, b) => b.res - a.res);

    const sortedResults = paired.map((p) => p.res);
    const sortedDice = paired.map((p) => p.dice ?? []);

    // Reset assignments and scores
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
    emit('update:state', newState);

    hasRolled.value = true;
    isAnimating.value = true;
    animationCompleted.value = Array.from({ length: 6 }, () => false);
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

    // Copy existing assignments, filtering out the current roll index and the target ability if it was assigned elsewhere
    for (const [idxStr, assignedAbility] of Object.entries(
      localState.value.assignments,
    )) {
      const idx = Number(idxStr);

      if (idx === rollIndex) {
        continue; // Skip current roll's old assignment
      }

      if (ability !== null && assignedAbility === ability) {
        continue; // Unassign ability from other roll
      }

      newAssignments[idx] = assignedAbility;
    }

    // Assign new ability if not null
    if (ability !== null) {
      newAssignments[rollIndex] = ability;
    }

    // Recalculate scores
    const newScores = { ...localState.value.scores };

    // Reset all to 0 first
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
    emit('update:state', newState);
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
          'border-success bg-success/5': !isAnimating && rollValue === 18,
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
            @update:model-value="
              (v) => updateAssignment(index, isAbilityKey(v) ? v : null)
            "
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
