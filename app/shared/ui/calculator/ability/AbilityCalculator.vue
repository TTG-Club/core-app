<script setup lang="ts">
  import { computed, ref } from 'vue';

  import BonusesTab from './BonusesTab.vue';
  import RandomSetComponent from './RandomSetComponent.vue';
  import PointBayComponent from './PointBayComponent.vue';
  import ArrayComponent from './ArrayComponent.vue';

  import { AbilityKey } from '~/shared/types';
  import type { BaseAbilityScores } from '~/shared/types';

  type Mode = 'bonuses' | 'dice' | 'pointBuy' | 'array';

  type TabItem = {
    key: Mode;
    label: string;
  };

  type AbilityShort = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type ShortAbilityScores = Record<AbilityShort, number>;

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

  const normalizeBaseScores = (value: BaseAbilityScores): BaseAbilityScores => {
    return {
      [AbilityKey.STRENGTH]: normalizeNumber(
        value[AbilityKey.STRENGTH],
        defaultBaseScores[AbilityKey.STRENGTH],
      ),
      [AbilityKey.DEXTERITY]: normalizeNumber(
        value[AbilityKey.DEXTERITY],
        defaultBaseScores[AbilityKey.DEXTERITY],
      ),
      [AbilityKey.CONSTITUTION]: normalizeNumber(
        value[AbilityKey.CONSTITUTION],
        defaultBaseScores[AbilityKey.CONSTITUTION],
      ),
      [AbilityKey.INTELLIGENCE]: normalizeNumber(
        value[AbilityKey.INTELLIGENCE],
        defaultBaseScores[AbilityKey.INTELLIGENCE],
      ),
      [AbilityKey.WISDOM]: normalizeNumber(
        value[AbilityKey.WISDOM],
        defaultBaseScores[AbilityKey.WISDOM],
      ),
      [AbilityKey.CHARISMA]: normalizeNumber(
        value[AbilityKey.CHARISMA],
        defaultBaseScores[AbilityKey.CHARISMA],
      ),
    };
  };

  const normalizeBonusScores = (
    value: BaseAbilityScores,
  ): BaseAbilityScores => {
    return {
      [AbilityKey.STRENGTH]: normalizeNumber(
        value[AbilityKey.STRENGTH],
        defaultBonusScores[AbilityKey.STRENGTH],
      ),
      [AbilityKey.DEXTERITY]: normalizeNumber(
        value[AbilityKey.DEXTERITY],
        defaultBonusScores[AbilityKey.DEXTERITY],
      ),
      [AbilityKey.CONSTITUTION]: normalizeNumber(
        value[AbilityKey.CONSTITUTION],
        defaultBonusScores[AbilityKey.CONSTITUTION],
      ),
      [AbilityKey.INTELLIGENCE]: normalizeNumber(
        value[AbilityKey.INTELLIGENCE],
        defaultBonusScores[AbilityKey.INTELLIGENCE],
      ),
      [AbilityKey.WISDOM]: normalizeNumber(
        value[AbilityKey.WISDOM],
        defaultBonusScores[AbilityKey.WISDOM],
      ),
      [AbilityKey.CHARISMA]: normalizeNumber(
        value[AbilityKey.CHARISMA],
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

  const sameShortScores = (
    a: ShortAbilityScores,
    b: ShortAbilityScores,
  ): boolean => {
    return (
      a.str === b.str &&
      a.dex === b.dex &&
      a.con === b.con &&
      a.int === b.int &&
      a.wis === b.wis &&
      a.cha === b.cha
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

  // ---------------- Tabs state ----------------

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

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  };

  const handleTabChange = (payload: string | number): void => {
    const nextIndex = toIndex(payload);

    if (nextIndex === null) {
      return;
    }

    selectedTabIndex.value = nextIndex;
  };

  // ---------------- Source of truth: model ----------------
  // Important: keep object identity stable (cache), otherwise deep watchers / consumers can thrash.

  const baseCache = ref<BaseAbilityScores>(normalizeBaseScores(model.value));

  const baseScores = computed<BaseAbilityScores>({
    get() {
      const normalized = normalizeBaseScores(model.value);

      if (!sameBaseScores(baseCache.value, normalized)) {
        baseCache.value = normalized;
      }

      return baseCache.value;
    },
    set(next) {
      const normalized = normalizeBaseScores(next);

      if (sameBaseScores(model.value, normalized)) {
        return;
      }

      model.value = normalized;
    },
  });

  const shortCache = ref<ShortAbilityScores>(baseToShort(baseScores.value));

  const shortScores = computed<ShortAbilityScores>({
    get() {
      const nextShort = normalizeShortScores(baseToShort(baseScores.value));

      if (!sameShortScores(shortCache.value, nextShort)) {
        shortCache.value = nextShort;
      }

      return shortCache.value;
    },
    set(next) {
      const normalizedShort = normalizeShortScores(next);
      const nextBase = normalizeBaseScores(shortToBase(normalizedShort));

      if (sameBaseScores(baseScores.value, nextBase)) {
        return;
      }

      baseScores.value = nextBase;
    },
  });

  const bonusScores = ref<BaseAbilityScores>({ ...defaultBonusScores });

  // ---------------- Final (base + bonus) ----------------

  const normalizedBonusScores = computed<BaseAbilityScores>(() => {
    return normalizeBonusScores(bonusScores.value);
  });

  const finalScores = computed<BaseAbilityScores>(() => {
    const b = normalizedBonusScores.value;

    return {
      [AbilityKey.STRENGTH]:
        baseScores.value[AbilityKey.STRENGTH] + b[AbilityKey.STRENGTH],
      [AbilityKey.DEXTERITY]:
        baseScores.value[AbilityKey.DEXTERITY] + b[AbilityKey.DEXTERITY],
      [AbilityKey.CONSTITUTION]:
        baseScores.value[AbilityKey.CONSTITUTION] + b[AbilityKey.CONSTITUTION],
      [AbilityKey.INTELLIGENCE]:
        baseScores.value[AbilityKey.INTELLIGENCE] + b[AbilityKey.INTELLIGENCE],
      [AbilityKey.WISDOM]:
        baseScores.value[AbilityKey.WISDOM] + b[AbilityKey.WISDOM],
      [AbilityKey.CHARISMA]:
        baseScores.value[AbilityKey.CHARISMA] + b[AbilityKey.CHARISMA],
    };
  });

  const abilityModifier = (value: number): number => {
    return Math.floor((value - 10) / 2);
  };

  const formatModifier = (value: number): string => {
    const mod = abilityModifier(value);

    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const totalScore = computed<number>(() => {
    return (
      baseScores.value[AbilityKey.STRENGTH] +
      baseScores.value[AbilityKey.DEXTERITY] +
      baseScores.value[AbilityKey.CONSTITUTION] +
      baseScores.value[AbilityKey.INTELLIGENCE] +
      baseScores.value[AbilityKey.WISDOM] +
      baseScores.value[AbilityKey.CHARISMA]
    );
  });

  const totalFinalScore = computed<number>(() => {
    return (
      finalScores.value[AbilityKey.STRENGTH] +
      finalScores.value[AbilityKey.DEXTERITY] +
      finalScores.value[AbilityKey.CONSTITUTION] +
      finalScores.value[AbilityKey.INTELLIGENCE] +
      finalScores.value[AbilityKey.WISDOM] +
      finalScores.value[AbilityKey.CHARISMA]
    );
  });
</script>

<template>
  <div class="space-y-4">
    <UTabs
      :model-value="selectedTabIndex"
      :items="tabs"
      class="w-full"
      @update:model-value="handleTabChange"
    />

    <UCard>
      <div class="space-y-3">
        <div class="text-sm font-semibold">Сводка</div>

        <div
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200"
        >
          Сумма базовых характеристик:
          <span class="font-semibold">{{ totalScore }}</span>

          <span class="text-gray-500 dark:text-gray-400"> • </span>
          С учётом бонусов:
          <span class="font-semibold">{{ totalFinalScore }}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div class="rounded-xl bg-gray-50 p-2 text-center dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">СИЛ</div>

            <div class="text-lg font-semibold">
              {{ finalScores[AbilityKey.STRENGTH] }}
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ formatModifier(finalScores[AbilityKey.STRENGTH]) }})
              </span>
            </div>

            <div
              v-if="normalizedBonusScores[AbilityKey.STRENGTH]"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ baseScores[AbilityKey.STRENGTH] }} +
              {{ normalizedBonusScores[AbilityKey.STRENGTH] }})
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-2 text-center dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">ЛОВ</div>

            <div class="text-lg font-semibold">
              {{ finalScores[AbilityKey.DEXTERITY] }}
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ formatModifier(finalScores[AbilityKey.DEXTERITY]) }})
              </span>
            </div>

            <div
              v-if="normalizedBonusScores[AbilityKey.DEXTERITY]"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ baseScores[AbilityKey.DEXTERITY] }} +
              {{ normalizedBonusScores[AbilityKey.DEXTERITY] }})
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-2 text-center dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">ТЕЛ</div>

            <div class="text-lg font-semibold">
              {{ finalScores[AbilityKey.CONSTITUTION] }}
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ formatModifier(finalScores[AbilityKey.CONSTITUTION]) }})
              </span>
            </div>

            <div
              v-if="normalizedBonusScores[AbilityKey.CONSTITUTION]"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ baseScores[AbilityKey.CONSTITUTION] }} +
              {{ normalizedBonusScores[AbilityKey.CONSTITUTION] }})
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-2 text-center dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">ИНТ</div>

            <div class="text-lg font-semibold">
              {{ finalScores[AbilityKey.INTELLIGENCE] }}
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ formatModifier(finalScores[AbilityKey.INTELLIGENCE]) }})
              </span>
            </div>

            <div
              v-if="normalizedBonusScores[AbilityKey.INTELLIGENCE]"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ baseScores[AbilityKey.INTELLIGENCE] }} +
              {{ normalizedBonusScores[AbilityKey.INTELLIGENCE] }})
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-2 text-center dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">МДР</div>

            <div class="text-lg font-semibold">
              {{ finalScores[AbilityKey.WISDOM] }}
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ formatModifier(finalScores[AbilityKey.WISDOM]) }})
              </span>
            </div>

            <div
              v-if="normalizedBonusScores[AbilityKey.WISDOM]"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ baseScores[AbilityKey.WISDOM] }} +
              {{ normalizedBonusScores[AbilityKey.WISDOM] }})
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-2 text-center dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">ХАР</div>

            <div class="text-lg font-semibold">
              {{ finalScores[AbilityKey.CHARISMA] }}
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ formatModifier(finalScores[AbilityKey.CHARISMA]) }})
              </span>
            </div>

            <div
              v-if="normalizedBonusScores[AbilityKey.CHARISMA]"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ baseScores[AbilityKey.CHARISMA] }} +
              {{ normalizedBonusScores[AbilityKey.CHARISMA] }})
            </div>
          </div>
        </div>
      </div>
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

        <ArrayComponent
          v-else
          v-model="shortScores"
        />
      </KeepAlive>
    </div>
  </div>
</template>
