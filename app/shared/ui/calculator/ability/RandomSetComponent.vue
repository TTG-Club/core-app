<script setup lang="ts">
  import D6Icon from '~ui/calculator/ability/D6Icon.vue';

  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type AbilityScores = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  type D6 = 1 | 2 | 3 | 4 | 5 | 6;

  type DiceRoll = {
    d1: D6;
    d2: D6;
    d3: D6;
    d4: D6;
    droppedIndex: 0 | 1 | 2 | 3;
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

  const abilities: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

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

  const dicePool = ref<DicePoolItem[]>([]);

  const diceAssign = ref<Record<Ability, string | null>>({
    str: null,
    dex: null,
    con: null,
    int: null,
    wis: null,
    cha: null,
  });

  const toD6 = (n: number): D6 => {
    if (n === 1) return 1;
    if (n === 2) return 2;
    if (n === 3) return 3;
    if (n === 4) return 4;
    if (n === 5) return 5;

    return 6;
  };

  const randomIntInclusive = (min: number, max: number): D6 => {
    const range = max - min + 1;

    if (range <= 0) {
      return toD6(min);
    }

    if (typeof window !== 'undefined' && window.crypto) {
      const buf = new Uint32Array(1);

      window.crypto.getRandomValues(buf);

      const randomUint32 = buf[0] ?? 0;

      return toD6(min + (randomUint32 % range));
    }

    return toD6(min + Math.floor(Math.random() * range));
  };

  const getDroppedIndex = (
    values: [number, number, number, number],
  ): 0 | 1 | 2 | 3 => {
    const lowest = Math.min(values[0], values[1], values[2], values[3]);

    if (values[0] === lowest) {
      return 0;
    }

    if (values[1] === lowest) {
      return 1;
    }

    if (values[2] === lowest) {
      return 2;
    }

    return 3;
  };

  const roll4d6DropLowest = (): DiceRoll => {
    const d1 = randomIntInclusive(1, 6);
    const d2 = randomIntInclusive(1, 6);
    const d3 = randomIntInclusive(1, 6);
    const d4 = randomIntInclusive(1, 6);

    const values: [D6, D6, D6, D6] = [d1, d2, d3, d4];
    const droppedIndex = getDroppedIndex(values);
    const droppedValue = values[droppedIndex];

    return {
      d1,
      d2,
      d3,
      d4,
      droppedIndex,
      total: d1 + d2 + d3 + d4 - droppedValue,
    };
  };

  const createId = (index: number): string => {
    const t = Date.now();

    return `r${t}-${index}`;
  };

  const resetAssignments = () => {
    diceAssign.value = {
      str: null,
      dex: null,
      con: null,
      int: null,
      wis: null,
      cha: null,
    };
  };

  const rollDicePool = () => {
    const nextPool: DicePoolItem[] = [];

    for (let i = 0; i < 6; i += 1) {
      nextPool.push({
        id: createId(i),
        roll: roll4d6DropLowest(),
      });
    }

    dicePool.value = nextPool;
    resetAssignments();
    model.value = { ...defaultScores };
  };

  const dicePoolSelectItems = computed<SelectItem<string>[]>(() => {
    return dicePool.value.map((item, index) => ({
      label: `№${index + 1}: ${item.roll.total}`,
      value: item.id,
    }));
  });

  const diceScoreById = (id: string): number | null => {
    const found = dicePool.value.find((p) => p.id === id);

    return found ? found.roll.total : null;
  };

  const normalizeSelectId = (
    payload: string | number | undefined,
  ): string | null => {
    if (typeof payload === 'string') {
      return payload.length > 0 ? payload : null;
    }

    if (typeof payload === 'number') {
      return Number.isFinite(payload) ? String(payload) : null;
    }

    return null;
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

  const computedScores = computed<AbilityScores>(() => {
    const next: AbilityScores = { ...defaultScores };

    if (dicePool.value.length !== 6) {
      return next;
    }

    for (const a of abilities) {
      const id = diceAssign.value[a];

      if (!id) {
        continue;
      }

      const score = diceScoreById(id);

      if (score === null) {
        continue;
      }

      next[a] = score;
    }

    return next;
  });

  watch(
    computedScores,
    (next) => {
      model.value = { ...next };
    },
    { immediate: true, deep: true },
  );

  const modifier = (score: number): number => Math.floor((score - 10) / 2);

  const modifierLabel = (score: number): string => {
    const m = modifier(score);

    return m >= 0 ? `+${m}` : `${m}`;
  };

  const isReady = computed<boolean>(() => {
    return dicePool.value.length === 6;
  });

  const maxTotal = computed<number | null>(() => {
    if (dicePool.value.length === 0) {
      return null;
    }

    return Math.max(...dicePool.value.map((i) => i.roll.total));
  });

  const dieClass = (index: 0 | 1 | 2 | 3, roll: DiceRoll): string[] => {
    if (roll.droppedIndex === index) {
      return [
        'rounded-lg',
        'p-1',
        'opacity-60',
        'text-gray-400',
        'dark:text-gray-600',
      ];
    }

    const isMax = maxTotal.value !== null && roll.total === maxTotal.value;

    if (isMax) {
      return ['rounded-lg', 'p-1', 'text-green-600', 'dark:text-green-400'];
    }

    return ['rounded-lg', 'p-1', 'text-secondary'];
  };
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Сначала бросьте <span class="font-mono">4к6</span> шесть раз, затем
          распределите результаты по характеристикам.
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
            v-for="item in dicePool"
            :key="item.id"
            class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold">
                {{ item.roll.total }}
              </div>

              <div class="text-xs text-gray-500 dark:text-gray-400">
                мод {{ modifierLabel(item.roll.total) }}
              </div>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span :class="dieClass(0, item.roll)">
                <D6Icon
                  :value="item.roll.d1"
                  :size="22"
                />
              </span>

              <span :class="dieClass(1, item.roll)">
                <D6Icon
                  :value="item.roll.d2"
                  :size="22"
                />
              </span>

              <span :class="dieClass(2, item.roll)">
                <D6Icon
                  :value="item.roll.d3"
                  :size="22"
                />
              </span>

              <span :class="dieClass(3, item.roll)">
                <D6Icon
                  :value="item.roll.d4"
                  :size="22"
                />
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

                <template v-else>
                  Не назначено (будет {{ defaultScores[a] }})
                </template>
              </div>
            </div>

            <USelect
              :model-value="diceAssign[a] || undefined"
              :items="dicePoolSelectItems"
              class="w-64 max-w-full"
              :disabled="!isReady"
              placeholder="Выберите результат"
              @update:model-value="
                (v: string | number) => {
                  const id = normalizeSelectId(v);

                  if (!id) {
                    return;
                  }

                  setDiceAssignment(a, id);
                }
              "
            />
          </div>
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400">
          Один результат можно назначить только одной характеристике. Если
          выбрать занятый результат — он будет автоматически обменён местами.
          Максимальный результат подсвечен зелёным. В селекте в скобках
          показано, сколько очков вы получите/потеряете относительно базовых 10.
        </div>
      </div>
    </div>
  </UCard>
</template>
