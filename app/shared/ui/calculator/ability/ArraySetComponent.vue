<script setup lang="ts">
  import { ref, watch } from 'vue';

  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type AbilityScores = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  type SelectItem<T> = {
    label: string;
    value: T;
  };

  const abilities: Array<Ability> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const abilityLabel: Record<Ability, string> = {
    str: 'Сила',
    dex: 'Ловкость',
    con: 'Телосложение',
    int: 'Интеллект',
    wis: 'Мудрость',
    cha: 'Харизма',
  };

  const model = defineModel<AbilityScores>({ required: true });

  const standardArrayPool = [15, 14, 13, 12, 10, 8];

  const standardArrayItems: Array<SelectItem<number>> = standardArrayPool.map(
    (score) => ({
      label: String(score),
      value: score,
    }),
  );

  const defaultPick: AbilityScores = {
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  };

  const pick = ref<AbilityScores>({ ...defaultPick });

  const normalizeNumber = (value: unknown, fallback: number): number => {
    if (typeof value !== 'number') {
      return fallback;
    }

    return Number.isFinite(value) ? value : fallback;
  };

  const normalizeAbilityScores = (value: AbilityScores): AbilityScores => {
    return {
      str: normalizeNumber(value.str, defaultPick.str),
      dex: normalizeNumber(value.dex, defaultPick.dex),
      con: normalizeNumber(value.con, defaultPick.con),
      int: normalizeNumber(value.int, defaultPick.int),
      wis: normalizeNumber(value.wis, defaultPick.wis),
      cha: normalizeNumber(value.cha, defaultPick.cha),
    };
  };

  const abilityScoresEqual = (a: AbilityScores, b: AbilityScores): boolean => {
    return (
      a.str === b.str &&
      a.dex === b.dex &&
      a.con === b.con &&
      a.int === b.int &&
      a.wis === b.wis &&
      a.cha === b.cha
    );
  };

  const parseSelectValue = (value: unknown): number | null => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };

  const setValue = (ability: Ability, nextScore: number): void => {
    const previousScore = pick.value[ability];

    if (previousScore === nextScore) {
      return;
    }

    let otherAbility: Ability | null = null;

    for (const iterAbility of abilities) {
      if (iterAbility !== ability && pick.value[iterAbility] === nextScore) {
        otherAbility = iterAbility;

        break;
      }
    }

    if (otherAbility === null) {
      pick.value = { ...pick.value, [ability]: nextScore };

      return;
    }

    pick.value = {
      ...pick.value,
      [ability]: nextScore,
      [otherAbility]: previousScore,
    };
  };

  const handleSelectUpdate = (ability: Ability, payload: unknown): void => {
    const nextScore = parseSelectValue(payload);

    if (nextScore === null) {
      return;
    }

    setValue(ability, nextScore);
  };

  watch(
    model,
    (next) => {
      const normalized = normalizeAbilityScores(next);

      if (abilityScoresEqual(pick.value, normalized)) {
        return;
      }

      pick.value = normalized;
    },
    { immediate: true, deep: true },
  );

  watch(
    pick,
    (next) => {
      const normalized = normalizeAbilityScores(next);

      if (abilityScoresEqual(model.value, normalized)) {
        return;
      }

      model.value = normalized;
    },
    { deep: true },
  );

  const modifier = (score: number): number => Math.floor((score - 10) / 2);

  const modifierLabel = (score: number): string => {
    const mod = modifier(score);

    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Стандартный массив: <span class="font-mono">15 14 13 12 10 8</span>.
        Назначьте каждое значение одной характеристике.
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="abilityKey in abilities"
          :key="abilityKey"
          class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
        >
          <div class="min-w-0">
            <div class="font-semibold">
              {{ abilityLabel[abilityKey] }}
            </div>

            <div class="text-xs text-gray-500 dark:text-gray-400">
              Мод:
              {{ modifierLabel(pick[abilityKey]) }}
            </div>
          </div>

          <USelect
            :model-value="pick[abilityKey]"
            :items="standardArrayItems"
            class="w-28"
            placeholder="Значение"
            @update:model-value="
              (payload) => handleSelectUpdate(abilityKey, payload)
            "
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
