<script setup lang="ts">
  import { computed, ref, watch } from 'vue';

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

  type AbilityScoresLike =
    | Partial<Record<AbilityKey, unknown>>
    | null
    | undefined;

  type AbilityPickPayload = AbilityKey | Array<AbilityKey> | undefined;

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

  const normalizeNumber = (value: unknown, fallback: number): number => {
    if (typeof value !== 'number') {
      return fallback;
    }

    return Number.isFinite(value) ? value : fallback;
  };

  const normalizeAbilityScores = (value: AbilityScoresLike): AbilityScores => {
    const safeValue: Partial<Record<AbilityKey, unknown>> = value ?? {};

    return {
      [AbilityKey.STRENGTH]: normalizeNumber(safeValue[AbilityKey.STRENGTH], 0),
      [AbilityKey.DEXTERITY]: normalizeNumber(
        safeValue[AbilityKey.DEXTERITY],
        0,
      ),
      [AbilityKey.CONSTITUTION]: normalizeNumber(
        safeValue[AbilityKey.CONSTITUTION],
        0,
      ),
      [AbilityKey.INTELLIGENCE]: normalizeNumber(
        safeValue[AbilityKey.INTELLIGENCE],
        0,
      ),
      [AbilityKey.WISDOM]: normalizeNumber(safeValue[AbilityKey.WISDOM], 0),
      [AbilityKey.CHARISMA]: normalizeNumber(safeValue[AbilityKey.CHARISMA], 0),
    };
  };

  const sameAbilityScores = (a: AbilityScores, b: AbilityScores): boolean => {
    return (
      a[AbilityKey.STRENGTH] === b[AbilityKey.STRENGTH] &&
      a[AbilityKey.DEXTERITY] === b[AbilityKey.DEXTERITY] &&
      a[AbilityKey.CONSTITUTION] === b[AbilityKey.CONSTITUTION] &&
      a[AbilityKey.INTELLIGENCE] === b[AbilityKey.INTELLIGENCE] &&
      a[AbilityKey.WISDOM] === b[AbilityKey.WISDOM] &&
      a[AbilityKey.CHARISMA] === b[AbilityKey.CHARISMA]
    );
  };

  const normalizeAbilityPickPayload = (
    payload: AbilityPickPayload,
  ): AbilityKey | undefined => {
    if (!payload) {
      return undefined;
    }

    if (Array.isArray(payload)) {
      return payload[0];
    }

    return payload;
  };

  const normalizeSliderArgsToNumber = (
    args: unknown[],
    fallback: number,
  ): number => {
    const first = args[0];

    if (Array.isArray(first)) {
      return normalizeNumber(first[0], fallback);
    }

    return normalizeNumber(first, fallback);
  };

  const allowedAbilityKeys = computed<Array<AbilityKey>>(() => {
    return ABILITIES.map((ability) => ability.key);
  });

  const featSlots = computed<number>(() => {
    const currentLevel = level.value;

    if (currentLevel >= 19) {
      return 5;
    }

    if (currentLevel >= 16) {
      return 4;
    }

    if (currentLevel >= 12) {
      return 3;
    }

    if (currentLevel >= 8) {
      return 2;
    }

    if (currentLevel >= 4) {
      return 1;
    }

    return 0;
  });

  const featSlotLevels = computed<Array<number>>(() => {
    const slots = featSlots.value;
    const levels: Array<number> = [];

    if (slots >= 1) {
      levels.push(4);
    }

    if (slots >= 2) {
      levels.push(8);
    }

    if (slots >= 3) {
      levels.push(12);
    }

    if (slots >= 4) {
      levels.push(16);
    }

    if (slots >= 5) {
      levels.push(19);
    }

    return levels;
  });

  const isEpicFeatLevel = (featLevel: number): boolean => featLevel === 19;

  const featCategoriesForLevel = (featLevel: number): Array<string> => {
    return isEpicFeatLevel(featLevel) ? ['EPIC_BOON'] : ['GENERAL'];
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

      for (let slotIndex = slots; slotIndex < next.length; slotIndex += 1) {
        next[slotIndex] = undefined;
      }

      feats.value = next;
    },
    { immediate: true },
  );

  const categoriesToFetch = computed<Array<string>>(() => {
    const categories: Array<string> = ['GENERAL'];

    if (featSlots.value >= 5) {
      categories.push('EPIC_BOON');
    }

    return categories;
  });

  const categoriesKey = computed<string>(() => {
    return categoriesToFetch.value.join('|');
  });

  const { data: featSelectData } = await useAsyncData<
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

  const featMetaByUrl = computed<Map<string, FeatSelectResponse>>(() => {
    const map = new Map<string, FeatSelectResponse>();
    const list = featSelectData.value;

    if (!list) {
      return map;
    }

    for (const feat of list) {
      map.set(feat.url, feat);
    }

    return map;
  });

  const normalizeFeatUrl = (value: FeatModelValue): string | undefined => {
    if (!value) {
      return undefined;
    }

    if (Array.isArray(value)) {
      const first = value[0];

      return first && first.length > 0 ? first : undefined;
    }

    return value.length > 0 ? value : undefined;
  };

  const normalizeFeatModelForSelect = (
    value: FeatModelValue,
  ): string | Array<string> => {
    if (!value) {
      return '';
    }

    return value;
  };

  const getFeatMeta = (
    url: string | undefined,
  ): FeatSelectResponse | undefined => {
    if (!url) {
      return undefined;
    }

    return featMetaByUrl.value.get(url);
  };

  const getFeatIncrease = (url: string | undefined): number => {
    const meta = getFeatMeta(url);

    if (!meta) {
      return 0;
    }

    return meta.increase > 0 ? meta.increase : 0;
  };

  const getFeatAllowedAbilities = (
    url: string | undefined,
  ): Array<AbilityKey> => {
    const all = allowedAbilityKeys.value;
    const meta = getFeatMeta(url);

    if (!meta) {
      return all;
    }

    const allowed = meta.abilities;

    if (!allowed || allowed.length === 0) {
      return all;
    }

    const filtered: Array<AbilityKey> = [];

    for (const abilityKey of allowed) {
      if (all.includes(abilityKey)) {
        filtered.push(abilityKey);
      }
    }

    return filtered;
  };

  const nonRepeatableSelectedUrls = computed<Set<string>>(() => {
    const set = new Set<string>();

    for (let slotIndex = 0; slotIndex < featSlots.value; slotIndex += 1) {
      const url = normalizeFeatUrl(feats.value[slotIndex]);

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

  const featAbilityPicks = ref<Array<Array<AbilityKey | undefined>>>([
    [],
    [],
    [],
    [],
    [],
  ]);

  const ensureSlotArray = (
    next: Array<Array<AbilityKey | undefined>>,
    slotIndex: number,
  ): Array<AbilityKey | undefined> => {
    const existing = next[slotIndex];

    if (existing) {
      return existing;
    }

    const created: Array<AbilityKey | undefined> = [];

    next[slotIndex] = created;

    return created;
  };

  const ensureFeatAbilityPickLengths = (): void => {
    const next = featAbilityPicks.value.slice();

    for (let slotIndex = 0; slotIndex < next.length; slotIndex += 1) {
      const slotArray = ensureSlotArray(next, slotIndex);

      if (slotIndex >= featSlots.value) {
        slotArray.length = 0;

        continue;
      }

      const featUrl = normalizeFeatUrl(feats.value[slotIndex]);
      const increase = getFeatIncrease(featUrl);

      if (!featUrl || increase === 0) {
        slotArray.length = 0;

        continue;
      }

      const allowed = getFeatAllowedAbilities(featUrl);

      const resized: Array<AbilityKey | undefined> = [];
      const current = slotArray.slice();

      for (let pickIndex = 0; pickIndex < increase; pickIndex += 1) {
        resized.push(current[pickIndex]);
      }

      const cleaned: Array<AbilityKey | undefined> = resized.map((pick) => {
        if (!pick) {
          return undefined;
        }

        return allowed.includes(pick) ? pick : undefined;
      });

      if (allowed.length === 1) {
        const single = allowed[0];

        if (!single) {
          next[slotIndex] = cleaned;

          continue;
        }

        const filled: Array<AbilityKey> = [];

        for (let pickIndex = 0; pickIndex < increase; pickIndex += 1) {
          filled.push(single);
        }

        next[slotIndex] = filled;

        continue;
      }

      next[slotIndex] = cleaned;
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
  ): void => {
    const next = featAbilityPicks.value.slice();
    const slotPicks = next[slotIndex] ? next[slotIndex].slice() : [];

    slotPicks[pickIndex] = value;
    next[slotIndex] = slotPicks;

    featAbilityPicks.value = next;
  };

  const computedBonus = computed<AbilityScores>(() => {
    const nextBonus = emptyBonus();

    for (let slotIndex = 0; slotIndex < featSlots.value; slotIndex += 1) {
      const featUrl = normalizeFeatUrl(feats.value[slotIndex]);
      const increase = getFeatIncrease(featUrl);

      if (!featUrl || increase <= 0) {
        continue;
      }

      const picks = featAbilityPicks.value[slotIndex] ?? [];

      for (let pickIndex = 0; pickIndex < increase; pickIndex += 1) {
        const abilityKey = picks[pickIndex];

        if (abilityKey) {
          nextBonus[abilityKey] += 1;
        }
      }
    }

    return nextBonus;
  });

  watch(
    computedBonus,
    (next) => {
      const normalizedNext = normalizeAbilityScores(next);
      const normalizedCurrent = normalizeAbilityScores(bonus.value);

      if (sameAbilityScores(normalizedCurrent, normalizedNext)) {
        return;
      }

      bonus.value = normalizedNext;
    },
    { immediate: true },
  );

  const updateFeat = (slotIndex: number, value: FeatModelValue): void => {
    const next = feats.value.slice();

    if (slotIndex < 0 || slotIndex >= next.length) {
      return;
    }

    next[slotIndex] = value;
    feats.value = next;
  };

  const handleLevelChange = (...args: unknown[]): void => {
    const raw = normalizeSliderArgsToNumber(args, 1);
    const rounded = Math.round(raw);

    if (rounded < 1) {
      level.value = 1;

      return;
    }

    if (rounded > 20) {
      level.value = 20;

      return;
    }

    level.value = rounded;
  };

  const getIncreaseLabel = (url: string | undefined): string => {
    const meta = getFeatMeta(url);

    if (!meta) {
      return 'Данные черты ещё не загружены.';
    }

    if (meta.increase > 0) {
      return `Повышение характеристик: ${meta.increase}`;
    }

    return 'Эта черта не повышает характеристики.';
  };

  const getFeatAbilityPickKey = (
    slotIndex: number,
    pickIndex: number,
  ): string => {
    const featUrl = normalizeFeatUrl(feats.value[slotIndex]);

    return `${featUrl || 'none'}:${slotIndex}:${pickIndex}`;
  };

  const getFeatSelectKey = (slotIndex: number, featLevel: number): string => {
    const categories = featCategoriesForLevel(featLevel).join(',');
    const url = normalizeFeatUrl(feats.value[slotIndex]) || 'none';

    return `${slotIndex}:${featLevel}:${categories}:${url}`;
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
          v-for="(featLevel, slotIndex) in featSlotLevels"
          :key="featLevel"
          class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
        >
          <div
            class="mb-2 flex items-center justify-between gap-3 text-sm font-semibold"
          >
            <span>Уровень {{ featLevel }}</span>

            <span
              v-if="isEpicFeatLevel(featLevel)"
              class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
            >
              Эпическая
            </span>
          </div>

          <!-- All selects in one row on md+ -->
          <div class="flex flex-col gap-3 md:flex-row md:items-start">
            <div class="min-w-0 flex-1">
              <SelectFeat
                :key="getFeatSelectKey(slotIndex, featLevel)"
                :categories="featCategoriesForLevel(featLevel)"
                :exclude-urls="excludeUrlsForSlot(slotIndex)"
                :model-value="normalizeFeatModelForSelect(feats[slotIndex])"
                @update:model-value="
                  (payload) => updateFeat(slotIndex, payload)
                "
              />

              <div
                v-if="normalizeFeatUrl(feats[slotIndex])"
                class="mt-2 text-xs text-gray-500 dark:text-gray-400"
              >
                {{ getIncreaseLabel(normalizeFeatUrl(feats[slotIndex])) }}
              </div>
            </div>

            <div
              v-if="
                normalizeFeatUrl(feats[slotIndex]) &&
                getFeatIncrease(normalizeFeatUrl(feats[slotIndex])) > 0
              "
              class="flex flex-col gap-2 md:flex-row md:items-start md:gap-3"
            >
              <div class="text-xs text-gray-500 md:hidden dark:text-gray-400">
                Выберите характеристики ({{
                  getFeatIncrease(normalizeFeatUrl(feats[slotIndex]))
                }}):
              </div>

              <div
                v-for="pickIndex in getFeatIncrease(
                  normalizeFeatUrl(feats[slotIndex]),
                )"
                :key="getFeatAbilityPickKey(slotIndex, pickIndex - 1)"
                class="w-full md:w-64"
              >
                <SelectAbilities
                  :model-value="featAbilityPicks[slotIndex]?.[pickIndex - 1]"
                  :only="
                    getFeatAllowedAbilities(normalizeFeatUrl(feats[slotIndex]))
                  "
                  placeholder="Выберите характеристику (+1)"
                  @update:model-value="
                    (payload) =>
                      setFeatAbilityPick(
                        slotIndex,
                        pickIndex - 1,
                        normalizeAbilityPickPayload(payload),
                      )
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
