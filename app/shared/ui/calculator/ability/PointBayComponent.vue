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

  type PointBuyCostRow = {
    score: number;
    cost: number;
  };

  type PointBuySettings = {
    minBuy: number;
    maxBuy: number;
    budgetBuy: number;
    costs: Array<PointBuyCostRow>;
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

  const settingsModel = defineModel<PointBuySettings>('settings', {
    required: true,
  });

  const drawerOpen = ref<boolean>(false);

  const clamp = (value: number, min: number, max: number): number => {
    if (value < min) return min;
    if (value > max) return max;

    return value;
  };

  const ALL_SCORES: Array<number> = [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ];

  const normalizeBounds = () => {
    const min = clamp(settingsModel.value.minBuy, 3, 15);
    const max = clamp(settingsModel.value.maxBuy, 3, 15);

    if (min > max) {
      settingsModel.value = {
        ...settingsModel.value,
        minBuy: max,
        maxBuy: min,
      };

      return;
    }

    settingsModel.value = {
      ...settingsModel.value,
      minBuy: min,
      maxBuy: max,
    };
  };

  watch(
    () => [settingsModel.value.minBuy, settingsModel.value.maxBuy],
    () => {
      normalizeBounds();
    },
  );

  const getBaseCost = (score: number): number => {
    const found = settingsModel.value.costs.find((r) => r.score === score);

    return found ? found.cost : 0;
  };

  const pointCost = (score: number): number => {
    const min = clamp(settingsModel.value.minBuy, 3, 15);

    if (score <= min) {
      return 0;
    }

    return getBaseCost(score) - getBaseCost(min);
  };

  const scoreOptions = computed<Array<number>>(() => {
    const min = clamp(settingsModel.value.minBuy, 3, 15);
    const max = clamp(settingsModel.value.maxBuy, 3, 15);

    const values: Array<number> = [];

    for (let v = min; v <= max; v += 1) {
      values.push(v);
    }

    return values;
  });

  const spent = computed<number>(() => {
    let sum = 0;

    for (const a of abilities) {
      sum += pointCost(model.value[a]);
    }

    return sum;
  });

  const remaining = computed<number>(
    () => settingsModel.value.budgetBuy - spent.value,
  );

  const canSetScore = (ability: Ability, next: number): boolean => {
    const current = model.value[ability];
    const nextSpent = spent.value - pointCost(current) + pointCost(next);

    return nextSpent <= settingsModel.value.budgetBuy;
  };

  const handleChange = (ability: Ability, next: number) => {
    if (!canSetScore(ability, next)) {
      return;
    }

    model.value = { ...model.value, [ability]: next };
  };

  const deltaLabel = (delta: number): string => {
    if (delta === 0) {
      return '0';
    }

    return delta > 0 ? `+${delta}` : `${delta}`;
  };

  // ВАЖНО: это не общая стоимость, а "сколько добавится/вернётся" очков относительно текущего значения характеристики
  const selectItemsForAbility = (
    ability: Ability,
  ): Array<SelectItem<number>> => {
    const current = model.value[ability];
    const currentCost = pointCost(current);

    return scoreOptions.value.map((v) => {
      const nextCost = pointCost(v);
      const delta = nextCost - currentCost;

      return {
        label: `${v} (= ${deltaLabel(delta)})`,
        value: v,
      };
    });
  };

  const applyBoundsToScores = () => {
    normalizeBounds();

    const min = settingsModel.value.minBuy;
    const max = settingsModel.value.maxBuy;

    let next: AbilityScores = { ...model.value };

    for (const a of abilities) {
      if (next[a] < min) {
        next = { ...next, [a]: min };

        continue;
      }

      if (next[a] > max) {
        next = { ...next, [a]: max };
      }
    }

    model.value = next;
  };

  watch(
    () => [settingsModel.value.minBuy, settingsModel.value.maxBuy],
    () => {
      applyBoundsToScores();
    },
    { immediate: true },
  );

  const setBaseCost = (score: number, nextCost: number) => {
    const safeCost = clamp(nextCost, 0, 200);

    const next = settingsModel.value.costs.map((r) => {
      if (r.score !== score) {
        return r;
      }

      return { score: r.score, cost: safeCost };
    });

    settingsModel.value = { ...settingsModel.value, costs: next };
  };

  const resetSettings = () => {
    settingsModel.value = {
      minBuy: 8,
      maxBuy: 15,
      budgetBuy: 27,
      costs: [
        { score: 3, cost: 0 },
        { score: 4, cost: 0 },
        { score: 5, cost: 0 },
        { score: 6, cost: 0 },
        { score: 7, cost: 0 },
        { score: 8, cost: 0 },
        { score: 9, cost: 1 },
        { score: 10, cost: 2 },
        { score: 11, cost: 3 },
        { score: 12, cost: 4 },
        { score: 13, cost: 5 },
        { score: 14, cost: 7 },
        { score: 15, cost: 9 },
      ],
    };
  };

  const modifier = (score: number): number => Math.floor((score - 10) / 2);

  const modifierLabel = (score: number): string => {
    const m = modifier(score);

    return m >= 0 ? `+${m}` : `${m}`;
  };
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Покупка: {{ settingsModel.minBuy }}–{{ settingsModel.maxBuy }},
            бюджет {{ settingsModel.budgetBuy }}.
          </div>

          <div
            class="text-sm"
            :class="
              remaining < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-200'
            "
          >
            Осталось: <span class="font-semibold">{{ remaining }}</span>

            <span class="text-gray-500 dark:text-gray-400"
              >/ {{ settingsModel.budgetBuy }}</span
            >
          </div>
        </div>

        <UButton
          size="sm"
          variant="soft"
          @click="drawerOpen = true"
        >
          Настройки
        </UButton>
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
              Значение: <span class="font-semibold">{{ model[a] }}</span> ·
              Стоимость: {{ pointCost(model[a]) }} · Мод:
              {{ modifierLabel(model[a]) }}
            </div>
          </div>

          <USelect
            :model-value="model[a]"
            :items="selectItemsForAbility(a)"
            class="w-40"
            @update:model-value="(v: number) => handleChange(a, v)"
          />
        </div>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400">
        В селекте указано, сколько очков добавится/вернётся при замене текущего
        значения: <span class="font-mono">15 (= +2)</span>
        ,
        <span class="font-mono">12 (= -3)</span>.
      </div>
    </div>

    <UDrawer v-model:open="drawerOpen">
      <template #content>
        <div class="flex h-full flex-col">
          <div
            class="flex items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-gray-800"
          >
            <div class="min-w-0">
              <div class="text-base font-semibold">
                Настройки покупки значений
              </div>

              <div class="text-sm text-gray-500 dark:text-gray-400">
                Минимум/максимум, бюджет и стоимость значений.
              </div>
            </div>

            <UButton
              variant="ghost"
              size="sm"
              @click="drawerOpen = false"
            >
              Закрыть
            </UButton>
          </div>

          <div class="flex-1 space-y-4 overflow-auto p-4">
            <div
              class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div class="mb-2 text-sm font-semibold">Бюджет покупки</div>

              <UInput
                :model-value="String(settingsModel.budgetBuy)"
                type="number"
                class="w-40"
                @update:model-value="
                  (v: string) =>
                    (settingsModel = {
                      ...settingsModel,
                      budgetBuy: clamp(Number(v), 0, 200),
                    })
                "
              />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div class="mb-2 text-sm font-semibold">Минимум покупки</div>

                <USelect
                  :model-value="settingsModel.minBuy"
                  :items="ALL_SCORES"
                  class="w-40"
                  @update:model-value="
                    (v: number) =>
                      (settingsModel = {
                        ...settingsModel,
                        minBuy: clamp(v, 3, 15),
                      })
                  "
                />
              </div>

              <div
                class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div class="mb-2 text-sm font-semibold">Максимум покупки</div>

                <USelect
                  :model-value="settingsModel.maxBuy"
                  :items="ALL_SCORES"
                  class="w-40"
                  @update:model-value="
                    (v: number) =>
                      (settingsModel = {
                        ...settingsModel,
                        maxBuy: clamp(v, 3, 15),
                      })
                  "
                />
              </div>
            </div>

            <div
              class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div class="mb-3 text-sm font-semibold">
                Стоимость покупки для каждого значения
              </div>

              <div
                class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                <div
                  v-for="row in settingsModel.costs"
                  :key="row.score"
                  class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div class="mb-2 flex items-center justify-between text-sm">
                    <div class="font-semibold">
                      {{ row.score }}
                    </div>

                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ row.cost }}
                    </div>
                  </div>

                  <UInput
                    :model-value="String(row.cost)"
                    type="number"
                    @update:model-value="
                      (v: string) => setBaseCost(row.score, Number(v))
                    "
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 p-4 dark:border-gray-800">
            <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <UButton
                variant="soft"
                @click="resetSettings"
              >
                Сбросить настройки
              </UButton>

              <UButton @click="drawerOpen = false"> Готово </UButton>
            </div>
          </div>
        </div>
      </template>
    </UDrawer>
  </UCard>
</template>
