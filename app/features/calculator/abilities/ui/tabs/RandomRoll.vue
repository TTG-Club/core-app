<script setup lang="ts">
  import { useDiceRoller } from '~/features/dice-roller/composables/useDiceRoller';
  import { AbilityKey } from '~/shared/types/abilities';

  import { ABILITY_KEYS, ABILITY_LABELS } from '../../model/consts';

  import type { RandomRollState } from '../../model/types';

  const props = defineProps<{
    state: RandomRollState;
  }>();

  const emit = defineEmits<{
    (e: 'update:state', value: RandomRollState): void;
  }>();

  const { rollMultiple } = useDiceRoller();

  const localState = ref<RandomRollState>({ ...props.state });

  watch(
    () => props.state,
    (newVal) => {
      localState.value = { ...newVal };
    },
    { deep: true },
  );

  function rollDice() {
    const results = rollMultiple('4d6dl1', 6);

    // Sort results descending
    results.sort((a, b) => b - a);

    // Reset assignments and scores
    const newScores = { ...localState.value.scores };

    for (const key of Object.values(AbilityKey)) {
      newScores[key] = 0;
    }

    const newState: RandomRollState = {
      scores: newScores,
      isComplete: false,
      rolls: results,
      assignments: {},
    };

    localState.value = newState;
    emit('update:state', newState);
  }

  function getAbilityOptions(_currentRollIndex: number) {
    return [
      { label: 'Не назначено', value: null },
      ...ABILITY_KEYS.map((key) => ({
        label: ABILITY_LABELS[key],
        value: key,
      })),
    ];
  }

  function isAbilityKey(k: unknown): k is AbilityKey {
    return (
      typeof k === 'string' && ABILITY_KEYS.some((key) => String(key) === k)
    );
  }

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
        Бросьте 4к6 (с отбрасыванием наименьшего) 6 раз.
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
        v-for="(roll, index) in localState.rolls"
        :key="index"
        class="bg-card flex items-center justify-between gap-3 rounded-xl border border-default p-3"
      >
        <div class="pl-2 text-xl font-bold">
          {{ roll }}
        </div>

        <USelect
          :model-value="localState.assignments[index] ?? null"
          :items="getAbilityOptions(index)"
          class="w-40"
          placeholder="Назначить..."
          @update:model-value="
            (v) => updateAssignment(index, isAbilityKey(v) ? v : null)
          "
        />
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
