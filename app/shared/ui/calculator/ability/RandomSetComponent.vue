<script setup lang="ts">
  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type AbilityScores = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  type DiceRoll = {
    d1: number;
    d2: number;
    d3: number;
    d4: number;
    dropped: number;
    total: number;
  };

  type DicePoolItem = {
    id: string;
    roll: DiceRoll;
  };

  type SelectItem<T> = {
    label: string;
    value: T;
  };

  const abilities: Array<Ability> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const abilityLabel: Record<Ability, string> = {
    str: 'Сила',
    dex: 'Ловкость',
    con: 'Телосложение',
    int: 'Интеллект',
    wis: 'Мудрость',
    cha: 'Харизма',
  };

  const defaultScores: AbilityScores = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const model = defineModel<AbilityScores>({ required: true });

  const dicePool = ref<Array<DicePoolItem>>([]);

  const diceAssign = ref<Record<Ability, string | null>>({
    str: null,
    dex: null,
    con: null,
    int: null,
    wis: null,
    cha: null,
  });

  const randomIntInclusive = (min: number, max: number): number => {
    const range = max - min + 1;

    if (typeof window !== 'undefined' && window.crypto) {
      const buf = new Uint32Array(1);

      window.crypto.getRandomValues(buf);

      return min + (buf[0] % range);
    }

    return min + Math.floor(Math.random() * range);
  };

  const roll4d6DropLowest = (): DiceRoll => {
    const d1 = randomIntInclusive(1, 6);
    const d2 = randomIntInclusive(1, 6);
    const d3 = randomIntInclusive(1, 6);
    const d4 = randomIntInclusive(1, 6);

    const values = [d1, d2, d3, d4];
    const lowest = Math.min(...values);

    return {
      d1,
      d2,
      d3,
      d4,
      dropped: lowest,
      total: d1 + d2 + d3 + d4 - lowest,
    };
  };

  const createId = (index: number): string => {
    const t = Date.now();

    return `r${t}-${index}`;
  };

  const rollDicePool = () => {
    const nextPool: Array<DicePoolItem> = [];

    for (let i = 0; i < 6; i += 1) {
      nextPool.push({
        id: createId(i),
        roll: roll4d6DropLowest(),
      });
    }

    dicePool.value = nextPool;

    diceAssign.value = {
      str: null,
      dex: null,
      con: null,
      int: null,
      wis: null,
      cha: null,
    };
  };

  const dicePoolSelectItems = computed<Array<SelectItem<string>>>(() => {
    return dicePool.value.map((item, index) => ({
      label: `#${index + 1}: ${item.roll.total}`,
      value: item.id,
    }));
  });

  const diceScoreById = (id: string): number | null => {
    const found = dicePool.value.find((p) => p.id === id);

    return found ? found.roll.total : null;
  };

  const setDiceAssignment = (ability: Ability, nextId: string) => {
    const prevId = diceAssign.value[ability];

    if (prevId === nextId) {
      return;
    }

    let otherAbility: Ability | null = null;

    for (const a of abilities) {
      if (a !== ability && diceAssign.value[a] === nextId) {
        otherAbility = a;

        break;
      }
    }

    if (otherAbility === null) {
      diceAssign.value = { ...diceAssign.value, [ability]: nextId };

      return;
    }

    diceAssign.value = {
      ...diceAssign.value,
      [ability]: nextId,
      [otherAbility]: prevId,
    };
  };

  const builtScores = computed<AbilityScores | null>(() => {
    if (dicePool.value.length !== 6) {
      return null;
    }

    for (const a of abilities) {
      if (!diceAssign.value[a]) {
        return null;
      }
    }

    const next: AbilityScores = { ...defaultScores };

    for (const a of abilities) {
      const id = diceAssign.value[a];

      if (!id) {
        return null;
      }

      const score = diceScoreById(id);

      if (score === null) {
        return null;
      }

      next[a] = score;
    }

    return next;
  });

  watch(
    builtScores,
    (next) => {
      if (next) {
        model.value = { ...next };
      }
    },
    { immediate: false, deep: true },
  );

  const modifier = (score: number): number => Math.floor((score - 10) / 2);

  const modifierLabel = (score: number): string => {
    const m = modifier(score);

    return m >= 0 ? `+${m}` : `${m}`;
  };
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Сначала бросьте <span class="font-mono">4d6</span> шесть раз (сброс
          нижнего куба), затем распределите результаты по характеристикам.
        </div>

        <UButton
          size="sm"
          @click="rollDicePool"
        >
          Бросить 6 раз
        </UButton>
      </div>

      <div
        v-if="dicePool.length === 0"
        class="rounded-2xl border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
      >
        Нажмите «Бросить 6 раз», чтобы получить 6 значений.
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(item, index) in dicePool"
            :key="item.id"
            class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold">
                #{{ index + 1 }}: {{ item.roll.total }}
              </div>

              <div class="text-xs text-gray-500 dark:text-gray-400">
                мод {{ modifierLabel(item.roll.total) }}
              </div>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span
                class="rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-800"
              >
                {{ item.roll.d1 }}
              </span>

              <span
                class="rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-800"
              >
                {{ item.roll.d2 }}
              </span>

              <span
                class="rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-800"
              >
                {{ item.roll.d3 }}
              </span>

              <span
                class="rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-800"
              >
                {{ item.roll.d4 }}
              </span>

              <span class="text-xs text-gray-500 dark:text-gray-400">
                сброс: {{ item.roll.dropped }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="a in abilities"
            :key="a"
            class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
          >
            <div class="min-w-0">
              <div class="font-semibold">
                {{ abilityLabel[a] }}
              </div>

              <div class="text-xs text-gray-500 dark:text-gray-400">
                <template v-if="diceAssign[a]">
                  <span class="font-semibold">
                    {{ diceScoreById(diceAssign[a] || '') }}
                  </span>
                </template>

                <template v-else> Не назначено </template>
              </div>
            </div>

            <USelect
              :model-value="diceAssign[a] || undefined"
              :items="dicePoolSelectItems"
              class="w-64 max-w-full"
              placeholder="Выберите результат"
              @update:model-value="(v: string) => setDiceAssignment(a, v)"
            />
          </div>
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400">
          Один результат можно назначить только одной характеристике. Если
          выбрать занятый результат — он будет автоматически обменён местами.
        </div>
      </div>
    </div>
  </UCard>
</template>
