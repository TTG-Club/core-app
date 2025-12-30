<script setup lang="ts">
  import { computed, ref, watch } from 'vue';

  import SelectFeatBonuses from './SelectFeatBonuses.vue';
  import SelectBackgroundBonuses from '~ui/calculator/ability/SelectBackgroundBonuses.vue';

  import { AbilityKey } from '~/shared/types';
  import type { BaseAbilityScores } from '~/shared/types';

  type BaseAbilityScoresLike =
    | Partial<Record<AbilityKey, unknown>>
    | null
    | undefined;

  const bonus = defineModel<BaseAbilityScores>('bonus', {
    required: true,
  });

  const emptyScores = (): BaseAbilityScores => {
    return {
      [AbilityKey.STRENGTH]: 0,
      [AbilityKey.DEXTERITY]: 0,
      [AbilityKey.CONSTITUTION]: 0,
      [AbilityKey.INTELLIGENCE]: 0,
      [AbilityKey.WISDOM]: 0,
      [AbilityKey.CHARISMA]: 0,
    };
  };

  const normalizeNumber = (value: unknown, fallback: number): number => {
    if (typeof value !== 'number') {
      return fallback;
    }

    return Number.isFinite(value) ? value : fallback;
  };

  const normalizeBaseScores = (
    value: BaseAbilityScoresLike,
  ): BaseAbilityScores => {
    const safeValue: Partial<Record<AbilityKey, unknown>> = value ?? {};

    return {
      [AbilityKey.STRENGTH]: normalizeNumber(safeValue[AbilityKey.STRENGTH], 0),
      [AbilityKey.DEXTERITY]: normalizeNumber(
        safeValue[AbilityKey.DEXTERITY],
        0,
      ),
      [AbilityKey.CONSTITUTION]: normalizeNumber(
        safeValue[AbilityKey.CONSTITUTION],
        0,
      ),
      [AbilityKey.INTELLIGENCE]: normalizeNumber(
        safeValue[AbilityKey.INTELLIGENCE],
        0,
      ),
      [AbilityKey.WISDOM]: normalizeNumber(safeValue[AbilityKey.WISDOM], 0),
      [AbilityKey.CHARISMA]: normalizeNumber(safeValue[AbilityKey.CHARISMA], 0),
    };
  };

  const sameBaseScores = (
    a: BaseAbilityScores,
    b: BaseAbilityScores,
  ): boolean => {
    return (
      a[AbilityKey.STRENGTH] === b[AbilityKey.STRENGTH] &&
      a[AbilityKey.DEXTERITY] === b[AbilityKey.DEXTERITY] &&
      a[AbilityKey.CONSTITUTION] === b[AbilityKey.CONSTITUTION] &&
      a[AbilityKey.INTELLIGENCE] === b[AbilityKey.INTELLIGENCE] &&
      a[AbilityKey.WISDOM] === b[AbilityKey.WISDOM] &&
      a[AbilityKey.CHARISMA] === b[AbilityKey.CHARISMA]
    );
  };

  const backgroundBonus = ref<BaseAbilityScores>(emptyScores());
  const featBonus = ref<BaseAbilityScores>(emptyScores());

  const totalBonus = computed<BaseAbilityScores>(() => {
    const normalizedBackgroundBonus = normalizeBaseScores(
      backgroundBonus.value,
    );

    const normalizedFeatBonus = normalizeBaseScores(featBonus.value);

    return {
      [AbilityKey.STRENGTH]:
        normalizedBackgroundBonus[AbilityKey.STRENGTH] +
        normalizedFeatBonus[AbilityKey.STRENGTH],
      [AbilityKey.DEXTERITY]:
        normalizedBackgroundBonus[AbilityKey.DEXTERITY] +
        normalizedFeatBonus[AbilityKey.DEXTERITY],
      [AbilityKey.CONSTITUTION]:
        normalizedBackgroundBonus[AbilityKey.CONSTITUTION] +
        normalizedFeatBonus[AbilityKey.CONSTITUTION],
      [AbilityKey.INTELLIGENCE]:
        normalizedBackgroundBonus[AbilityKey.INTELLIGENCE] +
        normalizedFeatBonus[AbilityKey.INTELLIGENCE],
      [AbilityKey.WISDOM]:
        normalizedBackgroundBonus[AbilityKey.WISDOM] +
        normalizedFeatBonus[AbilityKey.WISDOM],
      [AbilityKey.CHARISMA]:
        normalizedBackgroundBonus[AbilityKey.CHARISMA] +
        normalizedFeatBonus[AbilityKey.CHARISMA],
    };
  });

  watch(
    totalBonus,
    (next) => {
      const normalizedNext = normalizeBaseScores(next);
      const normalizedCurrent = normalizeBaseScores(bonus.value);

      if (sameBaseScores(normalizedCurrent, normalizedNext)) {
        return;
      }

      bonus.value = normalizedNext;
    },
    { immediate: true },
  );
</script>

<template>
  <div class="space-y-4">
    <UCard>
      <SelectBackgroundBonuses v-model:bonus="backgroundBonus" />
    </UCard>

    <UCard>
      <SelectFeatBonuses v-model:bonus="featBonus" />
    </UCard>
  </div>
</template>
