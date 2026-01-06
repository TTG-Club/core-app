<script setup lang="ts">
  import D6Icon from '~ui/calculator/ability/D6Icon.vue';

  type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

  type AbilityScores = {
    str: number | null;
    dex: number | null;
    con: number | null;
    int: number | null;
    wis: number | null;
    cha: number | null;
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

  const DICE_ICON_SIZE = 44;

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

  const abilitySelectItems = computed<SelectItem<Ability | null>[]>(() => {
    const items: SelectItem<Ability | null>[] = [
      { label: 'Не назначено', value: null },
    ];

    for (const ability of abilities) {
      items.push({
        label: abilityLabel[ability],
        value: ability,
      });
    }

    return items;
  });

  const getAbilitySelectItemsForDice = (
    diceId: string,
  ): SelectItem<Ability | null>[] => {
    const assignedAbility = Object.keys(diceAssign.value).find(
      (a) => diceAssign.value[a as Ability] === diceId,
    ) as Ability | undefined;

    return abilitySelectItems.value.map((item) => {
      if (item.value === null) {
        return item;
      }

      if (item.value === assignedAbility) {
        return item;
      }

      // Проверяем, занята ли эта характеристика другим броском
      const isOccupied =
        diceAssign.value[item.value] !== null &&
        diceAssign.value[item.value] !== diceId;

      if (isOccupied) {
        return {
          ...item,
          disabled: true,
        };
      }

      return item;
    });
  };

  const diceScoreById = (id: string): number | null => {
    const found = dicePool.value.find((p) => p.id === id);

    return found ? found.roll.total : null;
  };

  const setDiceAssignment = (diceId: string, nextAbility: Ability | null) => {
    const prevAbility = Object.keys(diceAssign.value).find(
      (a) => diceAssign.value[a as Ability] === diceId,
    ) as Ability | undefined;

    if (prevAbility === nextAbility) {
      return;
    }

    // Очищаем предыдущее назначение
    if (prevAbility) {
      diceAssign.value = { ...diceAssign.value, [prevAbility]: null };
    }

    // Устанавливаем новое назначение
    if (nextAbility) {
      diceAssign.value = { ...diceAssign.value, [nextAbility]: diceId };
    }
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

  const modifier = (score: number | null): number => {
    if (score === null) {
      return 0;
    }

    return Math.floor((score - 10) / 2);
  };

  const modifierLabel = (score: number | null): string => {
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
      return ['opacity-60', 'text-secondary'];
    }

    const isMax = maxTotal.value !== null && roll.total === maxTotal.value;

    if (isMax) {
      return ['text-secondary'];
    }

    return ['text-secondary'];
  };
</script>

<template>
  <div class="rounded-xl border border-default bg-muted p-4">
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-secondary">
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
        class="rounded-xl border border-default p-4 text-sm text-secondary"
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
            class="rounded-xl border border-default p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <USelect
                :model-value="
                  (Object.keys(diceAssign).find(
                    (a) => diceAssign[a as Ability] === item.id,
                  ) as Ability) || null
                "
                :items="getAbilitySelectItemsForDice(item.id)"
                class="w-full"
                :disabled="!isReady"
                placeholder="Выберите характеристику"
                @update:model-value="
                  (v: Ability | null) => {
                    setDiceAssignment(item.id, v);
                  }
                "
              />

              <div class="w-full text-lg font-semibold">
                {{ item.roll.total }}
                <span class="text-sm text-secondary"
                  >(Мод {{ modifierLabel(item.roll.total) }})
                </span>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-around gap-1">
              <span :class="dieClass(0, item.roll)">
                <D6Icon
                  :value="item.roll.d1"
                  :size="DICE_ICON_SIZE"
                />
              </span>

              <span :class="dieClass(1, item.roll)">
                <D6Icon
                  :value="item.roll.d2"
                  :size="DICE_ICON_SIZE"
                />
              </span>

              <span :class="dieClass(2, item.roll)">
                <D6Icon
                  :value="item.roll.d3"
                  :size="DICE_ICON_SIZE"
                />
              </span>

              <span :class="dieClass(3, item.roll)">
                <D6Icon
                  :value="item.roll.d4"
                  :size="DICE_ICON_SIZE"
                />
              </span>
            </div>
          </div>
        </div>

        <div class="text-xs text-secondary">
          Каждому результату броска можно назначить только одну характеристику.
          Занятые характеристики недоступны для выбора.
        </div>
      </div>
    </div>
  </div>
</template>
