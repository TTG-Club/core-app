<script setup lang="ts">
  import { ABILITY_KEYS, ABILITY_LABELS } from '~/shared/types';
  import { AbilityKey } from '~/shared/types/abilities';

  import { STANDARD_ARRAY_LABELS } from '../../consts';
  import { STANDARD_ARRAY, ZERO_SCORES } from '../../model';

  import type { AbilityScores } from '../../model';

  const props = defineProps<{
    selectedClassUrl?: string;
    classAbilityTemplate: number[];
  }>();

  const model = defineModel<AbilityScores>({ required: true });

  const localScores = ref<AbilityScores>({ ...ZERO_SCORES });

  watch(
    model,
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

  function getOptions(currentValue: number) {
    return [
      { label: STANDARD_ARRAY_LABELS.NOT_SELECTED, value: 0 },
      ...STANDARD_ARRAY.map((score) => {
        const isUsed = usedValues.value.has(score) && score !== currentValue;

        return {
          label: isUsed
            ? `${score} ${STANDARD_ARRAY_LABELS.USED_SUFFIX}`
            : String(score),
          value: score,
          disabled: false,
          class: isUsed ? 'text-secondary' : undefined,
        };
      }),
    ];
  }

  function updateScore(key: AbilityKey, value: number) {
    const newScores = { ...localScores.value };

    const conflictingKey = ABILITY_KEYS.find(
      (abilityKey) =>
        newScores[abilityKey] === value && abilityKey !== key && value !== 0,
    );

    if (conflictingKey) {
      newScores[conflictingKey] = 0;
    }

    newScores[key] = value;

    localScores.value = newScores;
    model.value = newScores;
  }

  function getScoreClass(score: number) {
    return usedValues.value.has(score)
      ? 'text-secondary'
      : 'text-primary font-bold';
  }

  const isClassTemplateButtonDisabled = computed(() => {
    return !props.selectedClassUrl || props.classAbilityTemplate.length === 0;
  });

  function applyClassTemplate() {
    if (isClassTemplateButtonDisabled.value) {
      return;
    }

    const newScores: AbilityScores = { ...ZERO_SCORES };

    for (let index = 0; index < ABILITY_KEYS.length; index += 1) {
      const ability = ABILITY_KEYS[index];

      if (!ability) {
        continue;
      }

      const value = props.classAbilityTemplate[index];

      if (value === undefined) {
        continue;
      }

      newScores[ability] = value;
    }

    localScores.value = newScores;
    model.value = newScores;
  }
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="text-sm text-secondary">
        {{ STANDARD_ARRAY_LABELS.DESCRIPTION_PREFIX }}
        <span
          v-for="(score, index) in STANDARD_ARRAY"
          :key="score"
          :class="getScoreClass(score)"
        >
          {{ score
          }}<span v-if="index < STANDARD_ARRAY.length - 1">, </span> </span
        >.
      </div>

      <UButton
        :disabled="isClassTemplateButtonDisabled"
        variant="subtle"
        color="neutral"
        size="sm"
        @click="applyClassTemplate"
      >
        {{ STANDARD_ARRAY_LABELS.APPLY_TEMPLATE }}
      </UButton>
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
          :items="getOptions(localScores[key])"
          class="w-32"
          @update:model-value="updateScore(key, Number($event))"
        />
      </div>
    </div>
  </div>
</template>
