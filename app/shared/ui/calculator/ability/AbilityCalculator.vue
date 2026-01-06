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

  type ShortAbilityScores = Record<AbilityShort, number | null>;

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
    str: null,
    dex: null,
    con: null,
    int: null,
    wis: null,
    cha: null,
  };

  const normalizeNumber = (value: unknown, fallback: number): number => {
    if (typeof value !== 'number') {
      return fallback;
    }

    return Number.isFinite(value) ? value : fallback;
  };

  const normalizeNumberOrNull = (
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
      str: normalizeNumberOrNull(value.str, defaultShortScores.str),
      dex: normalizeNumberOrNull(value.dex, defaultShortScores.dex),
      con: normalizeNumberOrNull(value.con, defaultShortScores.con),
      int: normalizeNumberOrNull(value.int, defaultShortScores.int),
      wis: normalizeNumberOrNull(value.wis, defaultShortScores.wis),
      cha: normalizeNumberOrNull(value.cha, defaultShortScores.cha),
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
      [AbilityKey.STRENGTH]:
        value.str ?? defaultBaseScores[AbilityKey.STRENGTH],
      [AbilityKey.DEXTERITY]:
        value.dex ?? defaultBaseScores[AbilityKey.DEXTERITY],
      [AbilityKey.CONSTITUTION]:
        value.con ?? defaultBaseScores[AbilityKey.CONSTITUTION],
      [AbilityKey.INTELLIGENCE]:
        value.int ?? defaultBaseScores[AbilityKey.INTELLIGENCE],
      [AbilityKey.WISDOM]: value.wis ?? defaultBaseScores[AbilityKey.WISDOM],
      [AbilityKey.CHARISMA]:
        value.cha ?? defaultBaseScores[AbilityKey.CHARISMA],
    };
  };

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

  const tabsModelValue = ref<number>(0);
  const level = ref<number>(1);

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
      const converted = baseToShort(normalizedBaseScores);

      // Если значение равно значению по умолчанию (10), устанавливаем null для режима "Стандартный набор"
      return {
        str:
          converted.str === defaultBaseScores[AbilityKey.STRENGTH]
            ? null
            : converted.str,
        dex:
          converted.dex === defaultBaseScores[AbilityKey.DEXTERITY]
            ? null
            : converted.dex,
        con:
          converted.con === defaultBaseScores[AbilityKey.CONSTITUTION]
            ? null
            : converted.con,
        int:
          converted.int === defaultBaseScores[AbilityKey.INTELLIGENCE]
            ? null
            : converted.int,
        wis:
          converted.wis === defaultBaseScores[AbilityKey.WISDOM]
            ? null
            : converted.wis,
        cha:
          converted.cha === defaultBaseScores[AbilityKey.CHARISMA]
            ? null
            : converted.cha,
      };
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

  // При переключении между режимами сбрасываем значения характеристик, сохраняя бонусы
  watch(selectedMode, (newMode, oldMode) => {
    // Сбрасываем только при переключении между dice/pointBuy/array
    const resetModes: Mode[] = ['dice', 'pointBuy', 'array'];

    if (
      resetModes.includes(newMode) &&
      resetModes.includes(oldMode) &&
      newMode !== oldMode
    ) {
      // Сбрасываем значения к умолчанию (10), сохраняя бонусы
      baseScores.value = { ...defaultBaseScores };
    }
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
    <div class="group relative mt-2 flex w-full rounded-lg bg-elevated">
      <UButton
        v-for="(tab, index) in tabs"
        :key="tab.key"
        :variant="tabsModelValue === index ? 'solid' : 'ghost'"
        :color="tabsModelValue === index ? 'primary' : 'neutral'"
        size="md"
        class="flex flex-1 items-center justify-center"
        @click="tabsModelValue = index"
      >
        {{ tab.label }}
      </UButton>
    </div>

    <div class="rounded-xl border border-default bg-muted p-4">
      <AbilityScoresDisplay
        :base-scores="baseScores"
        :final-scores="finalScores"
        :bonus-scores="normalizedBonusScores"
        :epic-boon-abilities="epicBoonAbilities"
      />
    </div>

    <div class="space-y-4">
      <KeepAlive>
        <BonusesTab
          v-if="selectedMode === 'bonuses'"
          v-model:bonus="bonusScores"
          v-model:level="level"
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
