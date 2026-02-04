<script setup lang="ts">
  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  interface AbilityScores {
    str: number | null;
    dex: number | null;
    con: number | null;
    int: number | null;
    wis: number | null;
    cha: number | null;
  }

  interface SelectItem<T> {
    label: string;
    value: T;
  }

  interface PointBuyCostRow {
    score: number;
    cost: number;
  }

  interface PointBuySettings {
    minBuy: number;
    maxBuy: number;
    budgetBuy: number;
    costs: Array<PointBuyCostRow>;
  }

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
    default: () => ({
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
    }),
  });

  const drawerOpen = ref<boolean>(false);

  function clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  }

  const ALL_SCORES: Array<number> = [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ];

  function normalizeBounds() {
    const min = clamp(settingsModel.value.minBuy, 3, 15);
    const max = clamp(settingsModel.value.maxBuy, 3, 15);

    let newMin = min;
    let newMax = max;

    if (min > max) {
      newMin = max;
      newMax = min;
    }

    if (
      settingsModel.value.minBuy === newMin &&
      settingsModel.value.maxBuy === newMax
    ) {
      return;
    }

    settingsModel.value = {
      ...settingsModel.value,
      minBuy: newMin,
      maxBuy: newMax,
    };
  }

  function getBaseCost(score: number): number {
    const found = settingsModel.value.costs.find((r) => r.score === score);

    return found ? found.cost : 0;
  }

  function pointCost(score: number | null): number {
    if (score === null) {
      return 0;
    }

    const min = clamp(settingsModel.value.minBuy, 3, 15);

    if (score <= min) {
      return 0;
    }

    return getBaseCost(score) - getBaseCost(min);
  }

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

  function canSetScore(ability: Ability, next: number | null): boolean {
    const current = model.value[ability];

    const nextSpent =
      spent.value - pointCost(current ?? null) + pointCost(next);

    return nextSpent <= settingsModel.value.budgetBuy;
  }

  function handleChange(ability: Ability, next: number | null | undefined) {
    if (next === null || next === undefined) {
      model.value = { ...model.value, [ability]: null };

      return;
    }

    if (!canSetScore(ability, next)) {
      return;
    }

    model.value = { ...model.value, [ability]: next };
  }

  function deltaLabel(delta: number): string {
    if (delta === 0) {
      return '0';
    }

    return delta > 0 ? `+${delta}` : `${delta}`;
  }

  // Не показываем "(0)" для текущего выбранного значения
  function selectItemsForAbility(
    ability: Ability,
  ): Array<SelectItem<number | null>> {
    const current = model.value[ability];
    const currentCost = pointCost(current ?? null);

    const items: Array<SelectItem<number | null>> = [
      {
        label: 'Не выбрано',
        value: null,
      },
    ];

    const scoreItems = scoreOptions.value.map((v) => {
      if (v === current) {
        return {
          label: `${v}`,
          value: v,
        };
      }

      const nextCost = pointCost(v);
      const delta = currentCost - nextCost;

      return {
        label: `${v} (${deltaLabel(delta)})`,
        value: v,
      };
    });

    return [...items, ...scoreItems];
  }

  function applyBoundsToScores() {
    normalizeBounds();

    const min = settingsModel.value.minBuy;
    const max = settingsModel.value.maxBuy;

    let next: AbilityScores = { ...model.value };

    for (const a of abilities) {
      const currentValue = next[a];

      if (currentValue !== null && currentValue < min) {
        next = { ...next, [a]: min };

        continue;
      }

      if (currentValue !== null && currentValue > max) {
        next = { ...next, [a]: max };
      }
    }

    model.value = next;
  }

  watch(
    () => [settingsModel.value.minBuy, settingsModel.value.maxBuy],
    () => {
      applyBoundsToScores();
    },
    { immediate: true },
  );

  function setBaseCost(score: number, nextCost: number) {
    const safeCost = clamp(nextCost, 0, 200);

    const next = settingsModel.value.costs.map((r) => {
      if (r.score !== score) {
        return r;
      }

      return { score: r.score, cost: safeCost };
    });

    settingsModel.value = { ...settingsModel.value, costs: next };
  }

  function resetSettings() {
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
  }

  function modifier(score: number | null): number {
    if (score === null) {
      return 0;
    }

    return Math.floor((score - 10) / 2);
  }

  function modifierLabel(score: number | null): string {
    const m = modifier(score);

    return m >= 0 ? `+${m}` : `${m}`;
  }
</script>

<template>
  <div class="rounded-xl border border-default bg-muted p-4">
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <div class="text-gray text-sm">
            Покупка: {{ settingsModel.minBuy }}–{{ settingsModel.maxBuy }},
            бюджет {{ settingsModel.budgetBuy }}.
          </div>

          <div
            class="text-sm"
            :class="remaining < 0 ? 'text-red' : 'text-secondary'"
          >
            Осталось: {{ remaining }}

            / {{ settingsModel.budgetBuy }}
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
          class="flex items-center justify-between gap-3 rounded-xl border border-default p-3"
        >
          <div class="min-w-0">
            <div class="font-semibold">
              {{ abilityLabel[a] }}
            </div>

            <div class="text-xs text-secondary">
              Стоимость: {{ pointCost(model[a]) }} · Мод:
              {{ modifierLabel(model[a]) }}
            </div>
          </div>

          <USelect
            :model-value="model[a] ?? null"
            :items="selectItemsForAbility(a)"
            class="w-40"
            @update:model-value="
              (v: number | null | undefined) => handleChange(a, v)
            "
          />
        </div>
      </div>

      <div class="text-xs text-secondary">
        В выборе указано, сколько очков вернётся/потратится при замене текущего
        значения: 8 (+2), 15 (-2).
      </div>
    </div>

    <USlideover
      v-model:open="drawerOpen"
      title="Настройки покупки значений"
      :ui="{
        content: 'w-full max-w-192 min-w-80',
      }"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-secondary">
            Минимум/максимум, бюджет и стоимость значений.
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="rounded-xl border border-default p-4">
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

            <div class="rounded-xl border border-default p-4">
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

            <div class="rounded-xl border border-default p-4">
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

          <div class="rounded-xl border border-default p-4">
            <div class="mb-3 text-sm font-semibold">
              Стоимость покупки для каждого значения
            </div>

            <div
              class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              <div
                v-for="row in settingsModel.costs"
                :key="row.score"
                class="rounded-xl border border-default p-3"
              >
                <div class="mb-2 flex items-center justify-between text-sm">
                  <div class="font-semibold">
                    {{ row.score }}
                  </div>

                  <div class="text-xs text-secondary">
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
      </template>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            variant="soft"
            @click.left.exact.prevent="resetSettings"
          >
            Стандартные настройки
          </UButton>

          <UButton @click.left.exact.prevent="drawerOpen = false">
            Сохранить
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
