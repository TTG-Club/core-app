<script setup lang="ts">
  import { ref, watch } from 'vue';

  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type AbilityScores = {
    str: number | null;
    dex: number | null;
    con: number | null;
    int: number | null;
    wis: number | null;
    cha: number | null;
  };

  type SelectItem<T> = {
    label: string;
    value: T;
    disabled?: boolean;
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

  const UNSELECTED_VALUE = null;
  const UNSELECTED_LABEL = 'Не выбрано';

  const standardArrayItems: Array<SelectItem<number | null>> = [
    { label: UNSELECTED_LABEL, value: UNSELECTED_VALUE },
    ...standardArrayPool.map((score) => ({
      label: String(score),
      value: score as number,
    })),
  ];

  const defaultPick: AbilityScores = {
    str: null,
    dex: null,
    con: null,
    int: null,
    wis: null,
    cha: null,
  };

  const pick = ref<AbilityScores>({ ...defaultPick });

  const normalizeNumber = (
    value: unknown,
    fallback: number | null,
  ): number | null => {
    if (value === null || value === undefined) {
      return fallback;
    }

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
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };

  const setValue = (ability: Ability, nextScore: number | null): void => {
    const previousScore = pick.value[ability];

    if (previousScore === nextScore) {
      return;
    }

    pick.value = { ...pick.value, [ability]: nextScore };
  };

  const getAvailableItems = (
    ability: Ability,
  ): Array<SelectItem<number | null>> => {
    const currentValue = pick.value[ability];
    const usedValues = new Set<number | null>();

    // Собираем все используемые значения, кроме текущего значения этой характеристики
    for (const iterAbility of abilities) {
      if (iterAbility !== ability) {
        const value = pick.value[iterAbility];

        if (value !== null) {
          usedValues.add(value);
        }
      }
    }

    // Возвращаем все элементы, но помечаем как disabled те, которые уже используются
    // "Не выбрано" (null) никогда не должно быть disabled
    return standardArrayItems.map((item) => ({
      ...item,
      disabled:
        item.value !== null &&
        item.value !== UNSELECTED_VALUE &&
        usedValues.has(item.value) &&
        item.value !== currentValue,
    }));
  };

  const handleSelectUpdate = (ability: Ability, payload: unknown): void => {
    const nextScore = parseSelectValue(payload);

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

  const modifier = (score: number | null): number => {
    if (score === null) {
      return 0;
    }

    return Math.floor((score - 10) / 2);
  };

  const modifierLabel = (score: number | null): string => {
    const mod = modifier(score);

    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
</script>

<template>
  <div class="rounded-xl border border-default bg-muted p-4">
    <div class="space-y-4">
      <div class="text-sm text-secondary">
        Стандартный массив: <span class="font-mono">15 14 13 12 10 8</span>.
        Назначьте каждое значение одной характеристике.
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="abilityKey in abilities"
          :key="abilityKey"
          class="flex items-center justify-between gap-3 rounded-xl border border-default p-3"
        >
          <div class="min-w-0">
            <div class="font-semibold">
              {{ abilityLabel[abilityKey] }}
            </div>

            <div class="text-xs text-secondary">
              Мод:
              {{ modifierLabel(pick[abilityKey]) }}
            </div>
          </div>

          <USelect
            :model-value="pick[abilityKey]"
            :items="getAvailableItems(abilityKey)"
            class="w-28"
            placeholder="Значение"
            @update:model-value="
              (payload) => handleSelectUpdate(abilityKey, payload)
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
