<script setup lang="ts">
  import RandomSetComponent from './RandomSetComponent.vue';
  import PointBayComponent from './PointBayComponent.vue';
  import ArrayComponent from './ArrayComponent.vue';

  import BonusesTab from './BonusesTab.vue';

  import { AbilityKey } from '~/shared/types';

  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type BaseAbilityScores = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  type AbilityScoresByKey = Record<AbilityKey, number>;

  type Mode = 'bonuses' | 'array' | 'pointBuy' | 'dice';

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

  const abilities: Array<Ability> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const tabs: Array<TabItem> = [
    { key: 'bonuses', label: 'Бонусы' },
    { key: 'dice', label: 'Случайный набор' },
    { key: 'pointBuy', label: 'Покупка значений' },
    { key: 'array', label: 'Стандартный набор' },
  ];

  const defaultScores: BaseAbilityScores = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const model = defineModel<BaseAbilityScores>({ required: true });

  const normalizeBaseScores = (value: BaseAbilityScores): BaseAbilityScores => {
    const str = Number.isFinite(value.str) ? value.str : defaultScores.str;
    const dex = Number.isFinite(value.dex) ? value.dex : defaultScores.dex;
    const con = Number.isFinite(value.con) ? value.con : defaultScores.con;
    const int = Number.isFinite(value.int) ? value.int : defaultScores.int;
    const wis = Number.isFinite(value.wis) ? value.wis : defaultScores.wis;
    const cha = Number.isFinite(value.cha) ? value.cha : defaultScores.cha;

    return { str, dex, con, int, wis, cha };
  };

  const baseScores = computed<BaseAbilityScores>({
    get: () => normalizeBaseScores(model.value),
    set: (next) => {
      model.value = normalizeBaseScores(next);
    },
  });

  watch(
    model,
    (next) => {
      const normalized = normalizeBaseScores(next);

      if (
        normalized.str !== next.str ||
        normalized.dex !== next.dex ||
        normalized.con !== next.con ||
        normalized.int !== next.int ||
        normalized.wis !== next.wis ||
        normalized.cha !== next.cha
      ) {
        model.value = normalized;
      }
    },
    { deep: true, immediate: true },
  );

  const selectedTabIndex = ref<number>(0);

  const selectedMode = computed<Mode>(() => {
    const item = tabs[selectedTabIndex.value];

    return item ? item.key : 'bonuses';
  });

  const toIndex = (payload: string | number): number | null => {
    if (typeof payload === 'number') {
      return Number.isFinite(payload) ? payload : null;
    }

    const parsed = Number(payload);

    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleTabChange = (payload: string | number) => {
    const nextIndex = toIndex(payload);

    if (nextIndex === null) {
      return;
    }

    selectedTabIndex.value = nextIndex;
  };

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

  const emptyBonus = (): AbilityScoresByKey => ({
    [AbilityKey.STRENGTH]: 0,
    [AbilityKey.DEXTERITY]: 0,
    [AbilityKey.CONSTITUTION]: 0,
    [AbilityKey.INTELLIGENCE]: 0,
    [AbilityKey.WISDOM]: 0,
    [AbilityKey.CHARISMA]: 0,
  });

  const bonusScores = ref<AbilityScoresByKey>(emptyBonus());

  const totalScore = computed<number>(() => {
    const v = baseScores.value;

    return v.str + v.dex + v.con + v.int + v.wis + v.cha;
  });

  const finalScores = computed<BaseAbilityScores>(() => {
    const v = baseScores.value;

    return {
      str: v.str + bonusScores.value[AbilityKey.STRENGTH],
      dex: v.dex + bonusScores.value[AbilityKey.DEXTERITY],
      con: v.con + bonusScores.value[AbilityKey.CONSTITUTION],
      int: v.int + bonusScores.value[AbilityKey.INTELLIGENCE],
      wis: v.wis + bonusScores.value[AbilityKey.WISDOM],
      cha: v.cha + bonusScores.value[AbilityKey.CHARISMA],
    };
  });

  const bonusByShort = computed<BaseAbilityScores>(() => ({
    str: bonusScores.value[AbilityKey.STRENGTH],
    dex: bonusScores.value[AbilityKey.DEXTERITY],
    con: bonusScores.value[AbilityKey.CONSTITUTION],
    int: bonusScores.value[AbilityKey.INTELLIGENCE],
    wis: bonusScores.value[AbilityKey.WISDOM],
    cha: bonusScores.value[AbilityKey.CHARISMA],
  }));
</script>

<template>
  <div class="space-y-4">
    <UTabs
      :model-value="selectedTabIndex"
      :items="tabs"
      class="w-full"
      @update:model-value="handleTabChange"
    />

    <!-- ВАЖНО: v-show вместо v-if, чтобы состояние вкладок сохранялось -->
    <div v-show="selectedMode === 'bonuses'">
      <BonusesTab v-model:bonus="bonusScores" />
    </div>

    <div v-show="selectedMode === 'dice'">
      <RandomSetComponent v-model="baseScores" />
    </div>

    <div v-show="selectedMode === 'pointBuy'">
      <PointBayComponent
        v-model="baseScores"
        v-model:settings="pointBuySettings"
      />
    </div>

    <div v-show="selectedMode === 'array'">
      <ArrayComponent v-model="baseScores" />
    </div>

    <UCard>
      <div class="space-y-3">
        <div class="text-sm font-semibold">Сводка</div>

        <div
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200"
        >
          Сумма базовых характеристик:
          <span class="font-semibold">{{ totalScore }}</span>
        </div>

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
              {{ finalScores[a] }}
            </div>

            <div
              v-if="bonusByShort[a] !== 0"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ baseScores[a] }} + {{ bonusByShort[a] }})
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
