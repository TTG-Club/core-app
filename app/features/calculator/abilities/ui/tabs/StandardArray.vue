<script setup lang="ts">
  import { ABILITY_KEYS, ABILITY_LABELS } from '~/shared/types';
  import { AbilityKey } from '~/shared/types/abilities';

  import { STANDARD_ARRAY } from '../../model/consts';

  import type { AbilityScores } from '../../model/types';

  const props = defineProps<{
    modelValue: AbilityScores;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: AbilityScores): void;
  }>();

  const localScores = ref<AbilityScores>({ ...props.modelValue });

  watch(
    () => props.modelValue,
    (newVal) => {
      localScores.value = { ...newVal };
    },
    { immediate: true, deep: true },
  );

  const usedValues = computed(() => {
    const set = new Set<number>();

    for (const key of Object.values(AbilityKey)) {
      const val = localScores.value[key];

      if (val !== 0 && STANDARD_ARRAY.includes(val)) {
        set.add(val);
      }
    }

    return set;
  });

  function getOptions(_currentKey: AbilityKey) {
    return [
      { label: 'Не выбрано', value: 0 },
      ...STANDARD_ARRAY.map((score) => ({
        label: String(score),
        value: score,
      })),
    ];
  }

  function updateScore(key: AbilityKey, value: number) {
    const newScores = { ...localScores.value };

    // Find if another ability already has this value
    const conflictingKey = ABILITY_KEYS.find(
      (k) => newScores[k] === value && k !== key,
    );

    if (conflictingKey) {
      // Clear the conflicting ability
      newScores[conflictingKey] = 0;
    }

    newScores[key] = value;

    localScores.value = newScores;
    emit('update:modelValue', newScores);
  }

  function getScoreClass(score: number) {
    return usedValues.value.has(score)
      ? 'text-secondary'
      : 'text-red-500 font-bold';
  }
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
  >
    <div class="text-sm text-secondary">
      Распределите значения:
      <span class="font-mono">
        <span
          v-for="(score, index) in STANDARD_ARRAY"
          :key="score"
          :class="getScoreClass(score)"
        >
          {{ score }}<span v-if="index < STANDARD_ARRAY.length - 1">, </span>
        </span> </span
      >.
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="key in ABILITY_KEYS"
        :key="key"
        class="bg-card flex items-center justify-between gap-3 rounded-xl border border-default p-3"
      >
        <div class="font-semibold">{{ ABILITY_LABELS[key] }}</div>

        <USelect
          :model-value="localScores[key]"
          :items="getOptions(key)"
          class="w-32"
          @update:model-value="(v) => updateScore(key, Number(v))"
        />
      </div>
    </div>
  </div>
</template>
