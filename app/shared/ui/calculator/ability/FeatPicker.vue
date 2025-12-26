<script setup lang="ts">
  import SelectFeat from '~ui/select/SelectFeat.vue';
  import SelectAbilities from '~ui/select/SelectAbilities.vue';

  import { ABILITIES, AbilityKey } from '~/shared/types';

  type AbilityScores = Record<AbilityKey, number>;
  type FeatModelValue = string | Array<string> | undefined;

  type FeatSelectResponse = {
    url: string;
    category: string;
    abilities: Array<AbilityKey> | null;
    increase: number;
    repeatability: boolean;
  };

  const level = defineModel<number>('level', { default: 1 });

  const bonus = defineModel<AbilityScores>('bonus', {
    default: () => ({
      [AbilityKey.STRENGTH]: 0,
      [AbilityKey.DEXTERITY]: 0,
      [AbilityKey.CONSTITUTION]: 0,
      [AbilityKey.INTELLIGENCE]: 0,
      [AbilityKey.WISDOM]: 0,
      [AbilityKey.CHARISMA]: 0,
    }),
  });

  const emptyBonus = (): AbilityScores => ({
    [AbilityKey.STRENGTH]: 0,
    [AbilityKey.DEXTERITY]: 0,
    [AbilityKey.CONSTITUTION]: 0,
    [AbilityKey.INTELLIGENCE]: 0,
    [AbilityKey.WISDOM]: 0,
    [AbilityKey.CHARISMA]: 0,
  });

  const allowedAbilityKeys = computed<Array<AbilityKey>>(() =>
    ABILITIES.map((a) => a.key),
  );

  const featSlots = computed<number>(() => {
    const l = level.value;

    if (l >= 19) return 5;
    if (l >= 16) return 4;
    if (l >= 12) return 3;
    if (l >= 8) return 2;
    if (l >= 4) return 1;

    return 0;
  });

  const featSlotLevels = computed<Array<number>>(() => {
    const slots = featSlots.value;
    const levels: Array<number> = [];

    if (slots >= 1) levels.push(4);
    if (slots >= 2) levels.push(8);
    if (slots >= 3) levels.push(12);
    if (slots >= 4) levels.push(16);
    if (slots >= 5) levels.push(19);

    return levels;
  });

  const featCategoriesForSlot = (index: number): Array<string> => {
    if (index === 4) return ['EPIC_BOON'];

    return ['GENERAL'];
  };

  const feats = ref<Array<FeatModelValue>>([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

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

  // meta: select?categories=...
  const categoriesToFetch = computed<Array<string>>(() => {
    const categories: Array<string> = ['GENERAL'];

    if (featSlots.value >= 5) {
      categories.push('EPIC_BOON');
    }

    return categories;
  });

  const categoriesKey = computed<string>(() =>
    categoriesToFetch.value.join('|'),
  );

  const { data: featSelectData, refresh: refreshFeatMeta } = await useAsyncData<
    Array<FeatSelectResponse>
  >(
    () => `feats-select-for-increase:${categoriesKey.value}`,
    async () => {
      const categories = categoriesToFetch.value;

      return await $fetch<Array<FeatSelectResponse>>('/api/v2/feats/select', {
        method: 'get',
        query: { categories: categories.join(',') },
      });
    },
    { dedupe: 'defer', watch: [categoriesKey] },
  );

  watch(categoriesKey, () => {
    refreshFeatMeta();
  });

  const featMetaByUrl = computed<Map<string, FeatSelectResponse>>(() => {
    const map = new Map<string, FeatSelectResponse>();
    const list = featSelectData.value;

    if (!list) return map;

    for (const f of list) {
      map.set(f.url, f);
    }

    return map;
  });

  const normalizeFeatUrl = (value: FeatModelValue): string | undefined => {
    if (!value) {
      return undefined;
    }

    if (Array.isArray(value)) {
      const first = value[0];

      return first.length > 0 ? first : undefined;
    }

    return value.length > 0 ? value : undefined;
  };

  // Важно: для UI-селектов часто безопаснее не отдавать undefined как model-value.
  const normalizeFeatModelForSelect = (
    value: FeatModelValue,
  ): string | Array<string> => {
    if (!value) return '';

    return value;
  };

  const getFeatMeta = (
    url: string | undefined,
  ): FeatSelectResponse | undefined => {
    if (!url) return undefined;

    return featMetaByUrl.value.get(url);
  };

  const getFeatIncrease = (url: string | undefined): number => {
    const meta = getFeatMeta(url);

    if (!meta) return 0;

    return meta.increase > 0 ? meta.increase : 0;
  };

  const getFeatAllowedAbilities = (
    url: string | undefined,
  ): Array<AbilityKey> => {
    const all = allowedAbilityKeys.value;
    const meta = getFeatMeta(url);

    if (!meta) return all;

    const allowed = meta.abilities;

    if (!allowed || allowed.length === 0) return all;

    const filtered: Array<AbilityKey> = [];

    for (const a of allowed) {
      if (all.includes(a)) {
        filtered.push(a);
      }
    }

    return filtered;
  };

  // --- exclude неповторяемых черт из других слотов ---
  const nonRepeatableSelectedUrls = computed<Set<string>>(() => {
    const set = new Set<string>();

    for (let i = 0; i < featSlots.value; i += 1) {
      const url = normalizeFeatUrl(feats.value[i]);

      if (!url) {
        continue;
      }

      const meta = getFeatMeta(url);

      if (!meta) {
        continue;
      }

      if (!meta.repeatability) {
        set.add(url);
      }
    }

    return set;
  });

  const excludeUrlsForSlot = (slotIndex: number): Array<string> => {
    const selected = nonRepeatableSelectedUrls.value;
    const currentUrl = normalizeFeatUrl(feats.value[slotIndex]);

    const result: Array<string> = [];

    for (const url of selected) {
      if (currentUrl && url === currentUrl) {
        continue;
      }

      result.push(url);
    }

    return result;
  };

  // --- селекты характеристик по increase ---
  const featAbilityPicks = ref<Array<Array<AbilityKey | undefined>>>([
    [],
    [],
    [],
    [],
    [],
  ]);

  const ensureFeatAbilityPickLengths = () => {
    const next = featAbilityPicks.value.slice();

    for (let slot = 0; slot < next.length; slot += 1) {
      if (slot >= featSlots.value) {
        next[slot] = [];

        continue;
      }

      const featUrl = normalizeFeatUrl(feats.value[slot]);
      const increase = getFeatIncrease(featUrl);

      if (!featUrl || increase === 0) {
        next[slot] = [];

        continue;
      }

      const allowed = getFeatAllowedAbilities(featUrl);

      const current = next[slot] ? next[slot].slice() : [];
      const resized: Array<AbilityKey | undefined> = [];

      for (let i = 0; i < increase; i += 1) {
        resized.push(current[i]);
      }

      const cleaned: Array<AbilityKey | undefined> = resized.map((v) => {
        if (!v) return undefined;

        return allowed.includes(v) ? v : undefined;
      });

      if (allowed.length === 1) {
        const single = allowed[0];
        const filled: Array<AbilityKey> = [];

        for (let i = 0; i < increase; i += 1) {
          filled.push(single);
        }

        next[slot] = filled;

        continue;
      }

      next[slot] = cleaned;
    }

    featAbilityPicks.value = next;
  };

  watch(featSlots, ensureFeatAbilityPickLengths, { immediate: true });
  watch(feats, ensureFeatAbilityPickLengths, { deep: true });
  watch(featSelectData, ensureFeatAbilityPickLengths);

  const setFeatAbilityPick = (
    slotIndex: number,
    pickIndex: number,
    value: AbilityKey | undefined,
  ) => {
    const next = featAbilityPicks.value.slice();
    const slot = next[slotIndex] ? next[slotIndex].slice() : [];

    slot[pickIndex] = value;
    next[slotIndex] = slot;

    featAbilityPicks.value = next;
  };

  const computedBonus = computed<AbilityScores>(() => {
    const b = emptyBonus();

    for (let slot = 0; slot < featSlots.value; slot += 1) {
      const featUrl = normalizeFeatUrl(feats.value[slot]);
      const increase = getFeatIncrease(featUrl);

      if (!featUrl || increase <= 0) {
        continue;
      }

      const picks = featAbilityPicks.value[slot] || [];

      for (let i = 0; i < increase; i += 1) {
        const a = picks[i];

        if (a) {
          b[a] += 1;
        }
      }
    }

    return b;
  });

  watch(
    computedBonus,
    (next) => {
      bonus.value = next;
    },
    { immediate: true, deep: true },
  );

  const updateFeat = (index: number, value: FeatModelValue) => {
    const next = feats.value.slice();

    if (index < 0 || index >= next.length) {
      return;
    }

    next[index] = value;
    feats.value = next;
  };

  const handleLevelChange = (next: number) => {
    const normalized = Math.round(next);

    if (normalized < 1) {
      level.value = 1;

      return;
    }

    if (normalized > 20) {
      level.value = 20;

      return;
    }

    level.value = normalized;
  };

  // слоты 0..4, эпическая — это 5-й слот (индекс 4)
  const isEpicSlot = (slotIndex: number): boolean => slotIndex === 4;

  const getIncreaseLabel = (url: string | undefined): string => {
    const meta = getFeatMeta(url);

    if (!meta) return 'Данные черты ещё не загружены.';
    if (meta.increase > 0) return `Повышение характеристик: ${meta.increase}`;

    return 'Эта черта не повышает характеристики.';
  };

  // Ключ для SelectAbilities: при смене черты инпуты не должны "переиспользоваться"
  const getFeatAbilityPickKey = (
    slotIndex: number,
    pickIndex: number,
  ): string => {
    const featUrl = normalizeFeatUrl(feats.value[slotIndex]);

    return `${featUrl || 'none'}:${slotIndex}:${pickIndex}`;
  };

  // Ключ для SelectFeat: принудительно ремоунтим при смене выбора/категорий
  const getFeatSelectKey = (slotIndex: number): string => {
    const cats = featCategoriesForSlot(slotIndex).join(',');
    const url = normalizeFeatUrl(feats.value[slotIndex]) || 'none';

    return `${slotIndex}:${cats}:${url}`;
  };
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
      <div class="mb-2 text-sm font-semibold">Уровень: {{ level }}</div>

      <USlider
        :model-value="level"
        :min="1"
        :max="20"
        :step="1"
        @update:model-value="handleLevelChange"
      />

      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Слоты черт: 4 / 8 / 12 / 16, плюс эпическая на 19 уровне.
      </div>
    </div>

    <div
      v-if="featSlots > 0"
      class="space-y-3"
    >
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Неповторяемые черты скрываются из списка, если уже выбраны в другом
        слоте.
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="(featLevel, idx) in featSlotLevels"
          :key="featLevel"
          class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
        >
          <div
            class="mb-2 flex items-center justify-between gap-3 text-sm font-semibold"
          >
            <span>Уровень {{ featLevel }}</span>

            <span
              v-if="isEpicSlot(idx)"
              class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
            >
              Эпическая
            </span>
          </div>

          <SelectFeat
            :key="getFeatSelectKey(idx)"
            :categories="featCategoriesForSlot(idx)"
            :exclude-urls="excludeUrlsForSlot(idx)"
            :model-value="normalizeFeatModelForSelect(feats[idx])"
            @update:model-value="(v) => updateFeat(idx, v)"
          />

          <div
            v-if="normalizeFeatUrl(feats[idx])"
            class="mt-2 text-xs text-gray-500 dark:text-gray-400"
          >
            {{ getIncreaseLabel(normalizeFeatUrl(feats[idx])) }}
          </div>

          <div
            v-if="
              normalizeFeatUrl(feats[idx]) &&
              getFeatIncrease(normalizeFeatUrl(feats[idx])) > 0
            "
            class="mt-3 space-y-2"
          >
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Выберите характеристики ({{
                getFeatIncrease(normalizeFeatUrl(feats[idx]))
              }}):
            </div>

            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="i in getFeatIncrease(normalizeFeatUrl(feats[idx]))"
                :key="getFeatAbilityPickKey(idx, i - 1)"
              >
                <SelectAbilities
                  :model-value="featAbilityPicks[idx]?.[i - 1]"
                  :only="getFeatAllowedAbilities(normalizeFeatUrl(feats[idx]))"
                  placeholder="Выберите характеристику (+1)"
                  @update:model-value="(v) => setFeatAbilityPick(idx, i - 1, v)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
