<script setup lang="ts">
  import { computed, ref, watch } from 'vue';

  import SelectBackground from '~ui/select/SelectBackground.vue';
  import SelectAbilities from '~ui/select/SelectAbilities.vue';

  import {
    ABILITIES,
    AbilityKey,
    type BackgroundSelectResponse,
  } from '~/shared/types';

  type AbilityScores = Record<AbilityKey, number>;

  type AbilityScoresLike =
    | Partial<Record<AbilityKey, unknown>>
    | null
    | undefined;

  const backgroundUrl = defineModel<string | undefined>('backgroundUrl', {
    default: undefined,
  });

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

  const emptyBonus = (): AbilityScores => {
    return {
      [AbilityKey.STRENGTH]: 0,
      [AbilityKey.DEXTERITY]: 0,
      [AbilityKey.CONSTITUTION]: 0,
      [AbilityKey.INTELLIGENCE]: 0,
      [AbilityKey.WISDOM]: 0,
      [AbilityKey.CHARISMA]: 0,
    };
  };

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

  const addBonus = (
    currentBonus: AbilityScores,
    abilityKey: AbilityKey | undefined,
    value: number,
  ): void => {
    if (!abilityKey) {
      return;
    }

    currentBonus[abilityKey] += value;
  };

  const allowedAbilityKeys = computed<Array<AbilityKey>>(() => {
    return ABILITIES.map((ability) => ability.key);
  });

  const abilityLookup = computed<Map<string, AbilityKey>>(() => {
    const map = new Map<string, AbilityKey>();

    for (const ability of ABILITIES) {
      map.set(String(ability.key).toLowerCase(), ability.key);
      map.set(String(ability.shortKey).toLowerCase(), ability.key);
    }

    // compatibility
    map.set('cha', AbilityKey.CHARISMA);

    // full english names
    map.set('strength', AbilityKey.STRENGTH);
    map.set('dexterity', AbilityKey.DEXTERITY);
    map.set('constitution', AbilityKey.CONSTITUTION);
    map.set('intelligence', AbilityKey.INTELLIGENCE);
    map.set('wisdom', AbilityKey.WISDOM);
    map.set('charisma', AbilityKey.CHARISMA);

    return map;
  });

  const normalizeAbilityFromApi = (raw: string): AbilityKey | undefined => {
    const key = raw.trim().toLowerCase();

    if (!key) {
      return undefined;
    }

    const found = abilityLookup.value.get(key);

    if (!found) {
      return undefined;
    }

    if (!allowedAbilityKeys.value.includes(found)) {
      return undefined;
    }

    return found;
  };

  const hasBackground = computed<boolean>(() => {
    return (
      typeof backgroundUrl.value === 'string' && backgroundUrl.value.length > 0
    );
  });

  const { data: backgroundSelectData } = await useAsyncData<
    Array<BackgroundSelectResponse>
  >(
    'backgrounds-select-for-ability-bonuses',
    async () => {
      return await $fetch<Array<BackgroundSelectResponse>>(
        '/api/v2/backgrounds/select',
        { method: 'get' },
      );
    },
    { dedupe: 'defer' },
  );

  const backgroundByUrl = computed<Map<string, BackgroundSelectResponse>>(
    () => {
      const map = new Map<string, BackgroundSelectResponse>();
      const list = backgroundSelectData.value ?? [];

      for (const background of list) {
        map.set(background.url, background);
      }

      return map;
    },
  );

  const backgroundAbilityOptions = computed<Array<AbilityKey>>(() => {
    if (!hasBackground.value) {
      return [];
    }

    const url = backgroundUrl.value;

    if (!url) {
      return [];
    }

    const background = backgroundByUrl.value.get(url);

    if (!background) {
      return [];
    }

    const result: Array<AbilityKey> = [];

    for (const rawAbilityKey of background.abilityScores) {
      const normalized = normalizeAbilityFromApi(rawAbilityKey);

      if (!normalized) {
        continue;
      }

      if (!result.includes(normalized)) {
        result.push(normalized);
      }
    }

    return result;
  });

  const pick1 = ref<AbilityKey | undefined>(undefined);
  const pick2 = ref<AbilityKey | undefined>(undefined);
  const pick3 = ref<AbilityKey | undefined>(undefined);

  const resetPicks = (): void => {
    pick1.value = undefined;
    pick2.value = undefined;
    pick3.value = undefined;
  };

  watch(
    backgroundUrl,
    () => {
      resetPicks();
    },
    { immediate: true },
  );

  watch(
    hasBackground,
    (enabled) => {
      if (enabled) {
        return;
      }

      resetPicks();
    },
    { immediate: true },
  );

  const keepOnlyAllowed = (): void => {
    const options = backgroundAbilityOptions.value;

    if (options.length !== 3) {
      resetPicks();

      return;
    }

    if (pick1.value && !options.includes(pick1.value)) {
      pick1.value = undefined;
    }

    if (pick2.value && !options.includes(pick2.value)) {
      pick2.value = undefined;
    }

    if (pick3.value && !options.includes(pick3.value)) {
      pick3.value = undefined;
    }
  };

  watch(backgroundAbilityOptions, keepOnlyAllowed, { immediate: true });
  watch([pick1, pick2, pick3], keepOnlyAllowed);

  const selectedPicks = computed<Array<AbilityKey>>(() => {
    const selected: Array<AbilityKey> = [];

    if (pick1.value) {
      selected.push(pick1.value);
    }

    if (pick2.value) {
      selected.push(pick2.value);
    }

    if (pick3.value) {
      selected.push(pick3.value);
    }

    return selected;
  });

  const countSelected = (value: AbilityKey): number => {
    let count = 0;

    for (const selectedAbility of selectedPicks.value) {
      if (selectedAbility === value) {
        count += 1;
      }
    }

    return count;
  };

  const excludeIfPickedTwice = (
    current: AbilityKey | undefined,
  ): Array<AbilityKey> => {
    const excluded: Array<AbilityKey> = [];

    for (const option of backgroundAbilityOptions.value) {
      const selectedCount = countSelected(option);

      if (selectedCount < 2) {
        continue;
      }

      if (current && current === option) {
        continue;
      }

      excluded.push(option);
    }

    return excluded;
  };

  const excludedForFirst = computed<Array<AbilityKey>>(() => {
    return excludeIfPickedTwice(pick1.value);
  });

  const excludedForSecond = computed<Array<AbilityKey>>(() => {
    return excludeIfPickedTwice(pick2.value);
  });

  const excludedForThird = computed<Array<AbilityKey>>(() => {
    return excludeIfPickedTwice(pick3.value);
  });

  const computedBonus = computed<AbilityScores>(() => {
    if (backgroundAbilityOptions.value.length !== 3) {
      return emptyBonus();
    }

    const firstPick = pick1.value;
    const secondPick = pick2.value;
    const thirdPick = pick3.value;

    if (firstPick && secondPick && thirdPick) {
      const nextBonus = emptyBonus();

      addBonus(nextBonus, firstPick, 1);
      addBonus(nextBonus, secondPick, 1);
      addBonus(nextBonus, thirdPick, 1);

      return nextBonus;
    }

    if (firstPick && secondPick && !thirdPick) {
      const nextBonus = emptyBonus();

      addBonus(nextBonus, firstPick, 2);
      addBonus(nextBonus, secondPick, 1);

      return nextBonus;
    }

    return emptyBonus();
  });

  watch(
    computedBonus,
    (next) => {
      const normalized = normalizeAbilityScores(next);

      if (sameAbilityScores(normalizeAbilityScores(bonus.value), normalized)) {
        return;
      }

      bonus.value = normalized;
    },
    { immediate: true },
  );
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="w-full sm:max-w-sm">
      <SelectBackground v-model="backgroundUrl" />
    </div>

    <div
      v-if="hasBackground"
      class="rounded-2xl border border-gray-200 p-3 dark:border-gray-800"
    >
      <div class="mb-2 text-sm font-semibold">
        Бонусы предыстории к характеристикам
      </div>

      <div class="text-sm text-gray-500 dark:text-gray-400">
        Выберите характеристики. Одна и та же характеристика может встречаться
        дважды (но не трижды).
      </div>

      <div
        v-if="backgroundAbilityOptions.length === 3"
        class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        <SelectAbilities
          v-model="pick1"
          :only="backgroundAbilityOptions"
          :exclude="excludedForFirst"
          placeholder="Выбор 1"
        />

        <SelectAbilities
          v-model="pick2"
          :only="backgroundAbilityOptions"
          :exclude="excludedForSecond"
          placeholder="Выбор 2"
        />

        <SelectAbilities
          v-model="pick3"
          :only="backgroundAbilityOptions"
          :exclude="excludedForThird"
          placeholder="Выбор 3"
        />
      </div>

      <div
        v-else
        class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200"
      >
        Для выбранной предыстории не удалось определить ровно 3 характеристики.
      </div>
    </div>
  </div>
</template>
