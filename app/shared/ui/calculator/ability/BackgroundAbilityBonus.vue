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
    b: AbilityScores,
    a: AbilityKey | undefined,
    value: number,
  ): void => {
    if (!a) {
      return;
    }

    b[a] += value;
  };

  const allowedAbilityKeys = computed<Array<AbilityKey>>(() => {
    return ABILITIES.map((a) => a.key);
  });

  const abilityLookup = computed<Map<string, AbilityKey>>(() => {
    const map = new Map<string, AbilityKey>();

    for (const a of ABILITIES) {
      map.set(String(a.key).toLowerCase(), a.key);
      map.set(String(a.shortKey).toLowerCase(), a.key);
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

      for (const bg of list) {
        map.set(bg.url, bg);
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

    const bg = backgroundByUrl.value.get(url);

    if (!bg) {
      return [];
    }

    const result: Array<AbilityKey> = [];

    for (const raw of bg.abilityScores) {
      const a = normalizeAbilityFromApi(raw);

      if (!a) {
        continue;
      }

      if (!result.includes(a)) {
        result.push(a);
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
    const opts = backgroundAbilityOptions.value;

    if (opts.length !== 3) {
      resetPicks();

      return;
    }

    if (pick1.value && !opts.includes(pick1.value)) {
      pick1.value = undefined;
    }

    if (pick2.value && !opts.includes(pick2.value)) {
      pick2.value = undefined;
    }

    if (pick3.value && !opts.includes(pick3.value)) {
      pick3.value = undefined;
    }
  };

  watch(backgroundAbilityOptions, keepOnlyAllowed, { immediate: true });
  watch([pick1, pick2, pick3], keepOnlyAllowed);

  const selectedPicks = computed<Array<AbilityKey>>(() => {
    const arr: Array<AbilityKey> = [];

    if (pick1.value) {
      arr.push(pick1.value);
    }

    if (pick2.value) {
      arr.push(pick2.value);
    }

    if (pick3.value) {
      arr.push(pick3.value);
    }

    return arr;
  });

  const countSelected = (value: AbilityKey): number => {
    let count = 0;

    for (const a of selectedPicks.value) {
      if (a === value) {
        count += 1;
      }
    }

    return count;
  };

  const excludeIfPickedTwice = (
    current: AbilityKey | undefined,
  ): Array<AbilityKey> => {
    const excluded: Array<AbilityKey> = [];

    for (const a of backgroundAbilityOptions.value) {
      const count = countSelected(a);

      if (count < 2) {
        continue;
      }

      if (current && current === a) {
        continue;
      }

      excluded.push(a);
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

    const a1 = pick1.value;
    const a2 = pick2.value;
    const a3 = pick3.value;

    if (a1 && a2 && a3) {
      const b = emptyBonus();

      addBonus(b, a1, 1);
      addBonus(b, a2, 1);
      addBonus(b, a3, 1);

      return b;
    }

    if (a1 && a2 && !a3) {
      const b = emptyBonus();

      addBonus(b, a1, 2);
      addBonus(b, a2, 1);

      return b;
    }

    return emptyBonus();
  });

  // IMPORTANT: do not emit v-model updates during SSR setup (can cause recursive SSR renders)
  if (import.meta.client) {
    watch(
      computedBonus,
      (next) => {
        if (sameAbilityScores(bonus.value, next)) {
          return;
        }

        bonus.value = next;
      },
      { immediate: true },
    );
  }
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
        дважды (но не три раза).
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
