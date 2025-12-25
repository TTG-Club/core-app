<script setup lang="ts">
  import RandomSetComponent from './RandomSetComponent.vue';
  import PointBayComponent from './PointBayComponent.vue';
  import ArrayComponent from './ArrayComponent.vue';

  import SelectBackground from '~ui/select/SelectBackground.vue';
  import SelectFeat from '~ui/select/SelectFeat.vue';

  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type AbilityScores = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  type Mode = 'array' | 'pointBuy' | 'dice';

  type TabItem = {
    key: Mode;
    label: string;
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

  type SelectItem<T> = {
    label: string;
    value: T;
  };

  type FeatModelValue = string | Array<string> | undefined;

  const abilities: Array<Ability> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const tabs: Array<TabItem> = [
    { key: 'dice', label: 'Случайный набор' },
    { key: 'pointBuy', label: 'Покупка значений' },
    { key: 'array', label: 'Стандартный набор' },
  ];

  const defaultScores: AbilityScores = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const model = defineModel<AbilityScores>({ required: true });

  const selectedTabIndex = ref<number>(0);
  const hasChosenMode = ref<boolean>(false);

  const selectedMode = computed<Mode | null>(() => {
    if (!hasChosenMode.value) {
      return null;
    }

    const item = tabs[selectedTabIndex.value];

    if (!item) {
      return null;
    }

    return item.key;
  });

  const scores = ref<AbilityScores>({ ...defaultScores });

  watch(
    scores,
    (next) => {
      model.value = { ...next };
    },
    { deep: true, immediate: true },
  );

  const pointBuySettings = ref<PointBuySettings>({
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
  });

  const totalScore = computed<number | null>(() => {
    if (selectedMode.value === null) {
      return null;
    }

    let sum = 0;

    for (const a of abilities) {
      sum += model.value[a];
    }

    return sum;
  });

  const toIndex = (payload: string | number): number | null => {
    if (typeof payload === 'number') {
      return Number.isFinite(payload) ? payload : null;
    }

    const parsed = Number(payload);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  };

  const handleTabChange = (payload: string | number) => {
    const nextIndex = toIndex(payload);

    if (nextIndex === null) {
      return;
    }

    selectedTabIndex.value = nextIndex;
    hasChosenMode.value = true;
  };

  // ---------- Уровень + выбор черт ----------

  const level = ref<number>(1);

  const levelItems = computed<Array<SelectItem<number>>>(() => {
    const items: Array<SelectItem<number>> = [];

    for (let l = 1; l <= 20; l += 1) {
      items.push({ label: `Уровень ${l}`, value: l });
    }

    return items;
  });

  /**
   * 2024: ASI/Feat слоты на 4/8/12/16, плюс Epic Boon на 19 уровне.
   * Здесь считаем "слоты черт" как:
   * - 4/8/12/16 -> 1..4
   * - 19..20 -> добавляется 5-й слот (эпический на 19)
   */
  const featSlots = computed<number>(() => {
    const l = level.value;

    if (l >= 19) {
      return 5;
    }

    if (l >= 16) {
      return 4;
    }

    if (l >= 12) {
      return 3;
    }

    if (l >= 8) {
      return 2;
    }

    if (l >= 4) {
      return 1;
    }

    return 0;
  });

  /**
   * Категории по слоту:
   * - слоты 1..4 всегда GENERAL
   * - слот 5 (index === 4) доступен только на 19–20 и ТОЛЬКО EPIC_BOON
   */
  const featCategoriesForSlot = (index: number): Array<string> => {
    if (index === 4) {
      return ['EPIC_BOON'];
    }

    return ['GENERAL'];
  };

  const feats = ref<Array<FeatModelValue>>([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  const updateFeat = (index: number, value: FeatModelValue) => {
    const next = feats.value.slice();

    if (index < 0 || index >= next.length) {
      return;
    }

    next[index] = value;
    feats.value = next;
  };

  watch(
    featSlots,
    (slots) => {
      const next = feats.value.slice();

      for (let i = slots; i < next.length; i += 1) {
        next[i] = undefined;
      }

      feats.value = next;
    },
    { immediate: true },
  );
</script>

<template>
  <div class="space-y-4">
    <UTabs
      :model-value="selectedTabIndex"
      :items="tabs"
      class="w-full"
      @update:model-value="handleTabChange"
    />

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <UCard class="lg:col-span-2">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="w-full sm:max-w-sm">
            <SelectBackground />
          </div>

          <div class="w-full sm:max-w-xs">
            <USelect
              v-model="level"
              :items="levelItems"
              placeholder="Выберите уровень"
            />
          </div>
        </div>

        <div
          v-if="featSlots > 0"
          class="mt-4 space-y-3"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Черты доступны на уровнях 4 / 8 / 12 / 16. На 19 уровне добавляется
            эпическая черта (Epic Boon).
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="index in featSlots"
              :key="index"
              class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
            >
              <div
                class="mb-2 flex items-center justify-between gap-3 text-sm font-semibold"
              >
                <span>Черта {{ index }}</span>

                <span
                  v-if="index === 5"
                  class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  Epic Boon
                </span>
              </div>

              <SelectFeat
                :categories="featCategoriesForSlot(index - 1)"
                :model-value="feats[index - 1]"
                @update:model-value="(v) => updateFeat(index - 1, v)"
              />
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="space-y-3">
          <div class="text-sm font-semibold">Сводка</div>

          <div
            v-if="totalScore !== null"
            class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200"
          >
            Сумма характеристик:
            <span class="font-semibold">{{ totalScore }}</span>
          </div>

          <div class="text-sm text-gray-500 dark:text-gray-400">
            Выбранный уровень:
            <span class="font-semibold text-gray-700 dark:text-gray-200">
              {{ level }}
            </span>
          </div>

          <div class="text-sm text-gray-500 dark:text-gray-400">
            Доступно черт:
            <span class="font-semibold text-gray-700 dark:text-gray-200">
              {{ featSlots }}
            </span>
          </div>
        </div>
      </UCard>
    </div>

    <div
      v-if="selectedMode === null"
      class="rounded-2xl border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
    >
      Выберите способ расчёта характеристик.
    </div>

    <template v-else>
      <RandomSetComponent
        v-if="selectedMode === 'dice'"
        v-model="scores"
      />

      <PointBayComponent
        v-else-if="selectedMode === 'pointBuy'"
        v-model="scores"
        v-model:settings="pointBuySettings"
      />

      <ArrayComponent
        v-else
        v-model="scores"
      />

      <UCard>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div
            v-for="a in abilities"
            :key="a"
            class="rounded-xl bg-gray-50 p-2 text-center dark:bg-gray-900"
          >
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ a.toUpperCase() }}
            </div>

            <div class="text-lg font-semibold">
              {{ model[a] }}
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
