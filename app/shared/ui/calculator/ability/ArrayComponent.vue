<script setup lang="ts">
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
    (v) => ({
      label: String(v),
      value: v,
    }),
  );

  const pick = ref<AbilityScores>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  });

  const setValue = (ability: Ability, next: number) => {
    const prev = pick.value[ability];

    if (prev === next) {
      return;
    }

    let otherAbility: Ability | null = null;

    for (const a of abilities) {
      if (a !== ability && pick.value[a] === next) {
        otherAbility = a;

        break;
      }
    }

    if (otherAbility === null) {
      pick.value = { ...pick.value, [ability]: next };

      return;
    }

    pick.value = {
      ...pick.value,
      [ability]: next,
      [otherAbility]: prev,
    };
  };

  watch(
    pick,
    (next) => {
      model.value = { ...next };
    },
    { immediate: true, deep: true },
  );

  const modifier = (score: number): number => Math.floor((score - 10) / 2);

  const modifierLabel = (score: number): string => {
    const m = modifier(score);

    return m >= 0 ? `+${m}` : `${m}`;
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
          v-for="a in abilities"
          :key="a"
          class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
        >
          <div class="min-w-0">
            <div class="font-semibold">
              {{ abilityLabel[a] }}
            </div>

            <div class="text-xs text-gray-500 dark:text-gray-400">
              Выбрано: <span class="font-semibold">{{ pick[a] }}</span> · Мод:
              {{ modifierLabel(pick[a]) }}
            </div>
          </div>

          <USelect
            :model-value="pick[a]"
            :items="standardArrayItems"
            class="w-28"
            placeholder="Значение"
            @update:model-value="(v: number) => setValue(a, v)"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
