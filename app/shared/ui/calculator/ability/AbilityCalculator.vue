<script setup lang="ts">
  import { computed, ref } from 'vue';

  import BonusesTab from './BonusesTab.vue';
  import RandomSetComponent from './RandomSetComponent.vue';
  import PointBayComponent from './PointBayComponent.vue';
  import ArraySetComponent from './ArraySetComponent.vue';
  import AbilityScoresDisplay from './AbilityScoresDisplay.vue';

  import { AbilityKey } from '~/shared/types';
  import type { BaseAbilityScores } from '~/shared/types';

  type Mode = 'bonuses' | 'dice' | 'pointBuy' | 'array';

  type TabItem = {
    key: Mode;
    label: string;
  };

  type AbilityShort = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type ShortAbilityScores = Record<AbilityShort, number>;

  type BaseAbilityScoresLike =
    | Partial<Record<AbilityKey, unknown>>
    | null
    | undefined;

  type EpicBoonAbilities = Partial<Record<AbilityKey, boolean>>;

  const tabs: Array<TabItem> = [
    { key: 'bonuses', label: 'Бонусы' },
    { key: 'dice', label: 'Случайный набор' },
    { key: 'pointBuy', label: 'Покупка значений' },
    { key: 'array', label: 'Стандартный набор' },
  ];

  const model = defineModel<BaseAbilityScores>({ required: true });

  const defaultBaseScores: BaseAbilityScores = {
    [AbilityKey.STRENGTH]: 10,
    [AbilityKey.DEXTERITY]: 10,
    [AbilityKey.CONSTITUTION]: 10,
    [AbilityKey.INTELLIGENCE]: 10,
    [AbilityKey.WISDOM]: 10,
    [AbilityKey.CHARISMA]: 10,
  };

  const defaultBonusScores: BaseAbilityScores = {
    [AbilityKey.STRENGTH]: 0,
    [AbilityKey.DEXTERITY]: 0,
    [AbilityKey.CONSTITUTION]: 0,
    [AbilityKey.INTELLIGENCE]: 0,
    [AbilityKey.WISDOM]: 0,
    [AbilityKey.CHARISMA]: 0,
  };

  const defaultShortScores: ShortAbilityScores = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
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
      [AbilityKey.STRENGTH]: normalizeNumber(
        safeValue[AbilityKey.STRENGTH],
        defaultBaseScores[AbilityKey.STRENGTH],
      ),
      [AbilityKey.DEXTERITY]: normalizeNumber(
        safeValue[AbilityKey.DEXTERITY],
        defaultBaseScores[AbilityKey.DEXTERITY],
      ),
      [AbilityKey.CONSTITUTION]: normalizeNumber(
        safeValue[AbilityKey.CONSTITUTION],
        defaultBaseScores[AbilityKey.CONSTITUTION],
      ),
      [AbilityKey.INTELLIGENCE]: normalizeNumber(
        safeValue[AbilityKey.INTELLIGENCE],
        defaultBaseScores[AbilityKey.INTELLIGENCE],
      ),
      [AbilityKey.WISDOM]: normalizeNumber(
        safeValue[AbilityKey.WISDOM],
        defaultBaseScores[AbilityKey.WISDOM],
      ),
      [AbilityKey.CHARISMA]: normalizeNumber(
        safeValue[AbilityKey.CHARISMA],
        defaultBaseScores[AbilityKey.CHARISMA],
      ),
    };
  };

  const normalizeBonusScores = (
    value: BaseAbilityScoresLike,
  ): BaseAbilityScores => {
    const safeValue: Partial<Record<AbilityKey, unknown>> = value ?? {};

    return {
      [AbilityKey.STRENGTH]: normalizeNumber(
        safeValue[AbilityKey.STRENGTH],
        defaultBonusScores[AbilityKey.STRENGTH],
      ),
      [AbilityKey.DEXTERITY]: normalizeNumber(
        safeValue[AbilityKey.DEXTERITY],
        defaultBonusScores[AbilityKey.DEXTERITY],
      ),
      [AbilityKey.CONSTITUTION]: normalizeNumber(
        safeValue[AbilityKey.CONSTITUTION],
        defaultBonusScores[AbilityKey.CONSTITUTION],
      ),
      [AbilityKey.INTELLIGENCE]: normalizeNumber(
        safeValue[AbilityKey.INTELLIGENCE],
        defaultBonusScores[AbilityKey.INTELLIGENCE],
      ),
      [AbilityKey.WISDOM]: normalizeNumber(
        safeValue[AbilityKey.WISDOM],
        defaultBonusScores[AbilityKey.WISDOM],
      ),
      [AbilityKey.CHARISMA]: normalizeNumber(
        safeValue[AbilityKey.CHARISMA],
        defaultBonusScores[AbilityKey.CHARISMA],
      ),
    };
  };

  const normalizeShortScores = (
    value: ShortAbilityScores,
  ): ShortAbilityScores => {
    return {
      str: normalizeNumber(value.str, defaultShortScores.str),
      dex: normalizeNumber(value.dex, defaultShortScores.dex),
      con: normalizeNumber(value.con, defaultShortScores.con),
      int: normalizeNumber(value.int, defaultShortScores.int),
      wis: normalizeNumber(value.wis, defaultShortScores.wis),
      cha: normalizeNumber(value.cha, defaultShortScores.cha),
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

  const baseToShort = (value: BaseAbilityScores): ShortAbilityScores => {
    return {
      str: value[AbilityKey.STRENGTH],
      dex: value[AbilityKey.DEXTERITY],
      con: value[AbilityKey.CONSTITUTION],
      int: value[AbilityKey.INTELLIGENCE],
      wis: value[AbilityKey.WISDOM],
      cha: value[AbilityKey.CHARISMA],
    };
  };

  const shortToBase = (value: ShortAbilityScores): BaseAbilityScores => {
    return {
      [AbilityKey.STRENGTH]: value.str,
      [AbilityKey.DEXTERITY]: value.dex,
      [AbilityKey.CONSTITUTION]: value.con,
      [AbilityKey.INTELLIGENCE]: value.int,
      [AbilityKey.WISDOM]: value.wis,
      [AbilityKey.CHARISMA]: value.cha,
    };
  };

  const selectedTabIndex = ref<number>(0);

  const clampTabIndex = (index: number): number => {
    const minIndex = 0;
    const maxIndex = Math.max(0, tabs.length - 1);

    if (index < minIndex) {
      return minIndex;
    }

    if (index > maxIndex) {
      return maxIndex;
    }

    return index;
  };

  const tabsModelValue = computed<number>({
    get() {
      return clampTabIndex(selectedTabIndex.value ?? 0);
    },
    set(next) {
      selectedTabIndex.value = clampTabIndex(next);
    },
  });

  const selectedMode = computed<Mode>(() => {
    const tabIndex = clampTabIndex(tabsModelValue.value);
    const tabItem = tabs[tabIndex];

    return tabItem ? tabItem.key : 'bonuses';
  });

  const baseScores = computed<BaseAbilityScores>({
    get() {
      return normalizeBaseScores(model.value);
    },
    set(next) {
      const normalized = normalizeBaseScores(next);

      if (sameBaseScores(model.value, normalized)) {
        return;
      }

      model.value = normalized;
    },
  });

  const shortScores = computed<ShortAbilityScores>({
    get() {
      const normalizedBaseScores = baseScores.value;

      return normalizeShortScores(baseToShort(normalizedBaseScores));
    },
    set(next) {
      const normalizedShortScores = normalizeShortScores(next);

      const nextBaseScores = normalizeBaseScores(
        shortToBase(normalizedShortScores),
      );

      const currentBaseScores = baseScores.value;

      if (sameBaseScores(currentBaseScores, nextBaseScores)) {
        return;
      }

      baseScores.value = nextBaseScores;
    },
  });

  const bonusScores = ref<BaseAbilityScores>({ ...defaultBonusScores });

  const epicBoonAbilities = ref<EpicBoonAbilities>({});

  const normalizedBonusScores = computed<BaseAbilityScores>(() => {
    return normalizeBonusScores(bonusScores.value);
  });

  const finalScores = computed<BaseAbilityScores>(() => {
    const normalizedBaseScores = baseScores.value;
    const normalizedBonus = normalizedBonusScores.value;

    return {
      [AbilityKey.STRENGTH]:
        normalizedBaseScores[AbilityKey.STRENGTH] +
        normalizedBonus[AbilityKey.STRENGTH],
      [AbilityKey.DEXTERITY]:
        normalizedBaseScores[AbilityKey.DEXTERITY] +
        normalizedBonus[AbilityKey.DEXTERITY],
      [AbilityKey.CONSTITUTION]:
        normalizedBaseScores[AbilityKey.CONSTITUTION] +
        normalizedBonus[AbilityKey.CONSTITUTION],
      [AbilityKey.INTELLIGENCE]:
        normalizedBaseScores[AbilityKey.INTELLIGENCE] +
        normalizedBonus[AbilityKey.INTELLIGENCE],
      [AbilityKey.WISDOM]:
        normalizedBaseScores[AbilityKey.WISDOM] +
        normalizedBonus[AbilityKey.WISDOM],
      [AbilityKey.CHARISMA]:
        normalizedBaseScores[AbilityKey.CHARISMA] +
        normalizedBonus[AbilityKey.CHARISMA],
    };
  });
</script>

<template>
  <div class="space-y-4">
    <UTabs
      v-model="tabsModelValue"
      :items="tabs"
      class="w-full"
      :ui="{
        list: 'rounded-xl bg-gray-100 p-1 dark:bg-gray-900',
        indicator: 'rounded-lg bg-white shadow-sm dark:bg-gray-800',
        trigger:
          'px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300',
        content: 'mt-0',
      }"
    />

    <UCard>
      <AbilityScoresDisplay
        :base-scores="baseScores"
        :final-scores="finalScores"
        :bonus-scores="normalizedBonusScores"
        :epic-boon-abilities="epicBoonAbilities"
      />
    </UCard>

    <div class="space-y-4">
      <KeepAlive>
        <BonusesTab
          v-if="selectedMode === 'bonuses'"
          v-model:bonus="bonusScores"
        />

        <RandomSetComponent
          v-else-if="selectedMode === 'dice'"
          v-model="shortScores"
        />

        <PointBayComponent
          v-else-if="selectedMode === 'pointBuy'"
          v-model="shortScores"
        />

        <ArraySetComponent
          v-else
          v-model="shortScores"
        />
      </KeepAlive>
    </div>
  </div>
</template>
