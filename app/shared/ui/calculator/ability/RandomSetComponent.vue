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

  const diceContainerStyle = {
    width: '44px',
    height: '44px',
  };

  const diceItemStyle = {
    width: '44px',
    height: '44px',
    margin: '0',
    padding: '0',
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

  // Начальные случайные значения для каждого блока
  const initialRandomValues = ref<Record<string, [D6, D6, D6, D6]>>({});

  const diceAssign = ref<Record<Ability, string | null>>({
    str: null,
    dex: null,
    con: null,
    int: null,
    wis: null,
    cha: null,
  });

  // Анимация кубиков
  const diceAnimationState = ref<
    Record<
      string,
      {
        currentValues: [D6, D6, D6, D6];
        isAnimating: boolean;
        animationStep: number;
        scrollPositions: number[];
        initialValues: [D6, D6, D6, D6]; // Случайные начальные значения
        completed: boolean; // Флаг завершения анимации
      }
    >
  >({});

  const isAnimating = computed(() => {
    return Object.values(diceAnimationState.value).some(
      (state) => state.isAnimating,
    );
  });

  // Кнопка активна после появления результатов (через 2 секунды)
  const buttonDisabledTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
  const isButtonDisabled = ref(false);

  // Следим за прогрессом анимации
  const hasResultsAppeared = computed(() => {
    return dicePool.value.some(
      (item) => (diceAnimationState.value[item.id]?.animationStep || 0) > 30,
    );
  });

  watch(hasResultsAppeared, (resultsVisible) => {
    if (buttonDisabledTimeout.value) {
      clearTimeout(buttonDisabledTimeout.value);
    }

    if (resultsVisible) {
      // Когда появились результаты, активируем кнопку через 200мс для плавности
      buttonDisabledTimeout.value = setTimeout(() => {
        isButtonDisabled.value = false;
      }, 200);
    } else if (dicePool.value.length > 0) {
      // Во время анимации (после броска) кнопка заблокирована
      isButtonDisabled.value = true;
    } else {
      // До броска кнопка активна
      isButtonDisabled.value = false;
    }
  });

  // Также следим за isAnimating для финальной активации
  watch(isAnimating, (newIsAnimating) => {
    if (!newIsAnimating && dicePool.value.length > 0) {
      // Все анимации завершились - гарантируем активацию кнопки
      if (buttonDisabledTimeout.value) {
        clearTimeout(buttonDisabledTimeout.value);
      }

      setTimeout(() => {
        isButtonDisabled.value = false;
      }, 50);
    }
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

  // Анимация одного кубика с эффектом барабана
  const animateDiceRoll = (
    diceId: string,
    finalRoll: DiceRoll,
    onComplete: () => void,
  ): void => {
    // Предотвращаем повторный запуск анимации для завершенных или активных
    if (
      diceAnimationState.value[diceId]?.completed ||
      diceAnimationState.value[diceId]?.isAnimating
    ) {
      onComplete();

      return;
    }

    const animationDuration = 4000; // Общая длительность 4 секунды
    const startTime = Date.now();

    // Используем уникальные начальные значения для каждого блока
    const initialValues: [D6, D6, D6, D6] = [
      (((diceId.charCodeAt(0) + 0) % 6) + 1) as D6,
      (((diceId.charCodeAt(0) + 1) % 6) + 1) as D6,
      (((diceId.charCodeAt(0) + 2) % 6) + 1) as D6,
      (((diceId.charCodeAt(0) + 3) % 6) + 1) as D6,
    ];

    diceAnimationState.value[diceId] = {
      currentValues: initialValues,
      isAnimating: true,
      animationStep: 0,
      initialValues: initialValues,
      completed: false,
      scrollPositions: [
        (initialValues[0] - 1) * 44,
        (initialValues[1] - 1) * 44,
        (initialValues[2] - 1) * 44,
        (initialValues[3] - 1) * 44,
      ],
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1); // Ограничиваем прогресс до 1

      // Вычисляем позиции прокрутки для каждого кубика
      const scrollPositions: number[] = [];

      for (let i = 0; i < 4; i++) {
        const finalValues: [D6, D6, D6, D6] = [
          finalRoll.d1,
          finalRoll.d2,
          finalRoll.d3,
          finalRoll.d4,
        ];

        const finalValue = finalValues[i];

        if (finalValue === undefined) {
          continue;
        }

        const uniqueOffset = (diceId.charCodeAt(0) + i) * 0.1; // Уникальное смещение для каждого кубика

        if (progress < 0.33) {
          // Первые 2 секунды (33%) - быстрая линейная прокрутка вниз
          const speed = 30; // еще более быстрая скорость для короткого времени
          const time = Date.now() * 0.001 * speed + uniqueOffset * 1000;

          // Линейная прокрутка вниз без скачков
          scrollPositions[i] = (time * 80) % (18 * 44); // 18 чисел для плавности
        } else {
          // Последние 4 секунды (67%) - плавное замедление к финальному значению
          const lateProgress = (progress - 0.33) / 0.67; // от 0 до 1 за последние 67%
          const targetPosition = (finalValue - 1) * 44; // 44px - размер кубика

          const animationState = diceAnimationState.value[diceId];

          if (!animationState) {
            continue;
          }

          const currentPosition = animationState.scrollPositions[i] || 0;

          // Используем более плавную интерполяцию для точной остановки
          const smoothProgress = 1 - Math.pow(1 - lateProgress, 4); // четвертая степень для плавности

          const newPosition =
            currentPosition +
            (targetPosition - currentPosition) * smoothProgress;

          // Выбираем позицию из второго блока чисел (7-12) для естественной остановки
          const finalTargetPosition = (finalValue - 1 + 6) * 44; // +6 для второго блока

          // Гарантируем точную остановку в последние 10% замедления
          if (lateProgress > 0.9) {
            scrollPositions[i] = finalTargetPosition;
          } else {
            scrollPositions[i] = newPosition;
          }
        }
      }

      // Обновляем состояние анимации
      const animationState = diceAnimationState.value[diceId];

      if (!animationState) {
        return;
      }

      animationState.scrollPositions = scrollPositions;

      // Для обратной совместимости, вычисляем текущие значения на основе позиций
      const finalValues: [D6, D6, D6, D6] = [
        finalRoll.d1,
        finalRoll.d2,
        finalRoll.d3,
        finalRoll.d4,
      ];

      const currentValues: [D6, D6, D6, D6] = [
        toD6(1),
        toD6(1),
        toD6(1),
        toD6(1),
      ];

      for (let index = 0; index < 4; index++) {
        const finalValue = finalValues[index];

        if (finalValue === undefined) {
          continue;
        }

        if (progress >= 0.95) {
          currentValues[index] = finalValue;
        } else {
          // Имитируем быстрое изменение значений во время прокрутки
          const variation = Math.sin(Date.now() * 0.008 + index * 0.5) * 1.5;

          currentValues[index] = toD6(
            Math.max(1, Math.min(6, finalValue + Math.floor(variation))),
          );
        }
      }

      animationState.currentValues = currentValues;
      animationState.animationStep = Math.floor(progress * 60);

      // Проверяем, достигли ли мы финальных значений
      const hasReachedFinal = scrollPositions.every((pos, index) => {
        const targetPos =
          ((finalRoll[`d${index + 1}` as keyof DiceRoll] as number) - 1 + 6) *
          44;

        return Math.abs(pos - targetPos) < 1; // Допуск 1px
      });

      if (!hasReachedFinal) {
        // Продолжаем анимацию пока не достигли финальных значений
        requestAnimationFrame(animate);
      } else {
        // Анимация завершена - устанавливаем финальные значения
        const finalAnimationState = diceAnimationState.value[diceId];

        if (!finalAnimationState) {
          onComplete();

          return;
        }

        const finalCurrentValues: [D6, D6, D6, D6] = [
          finalRoll.d1,
          finalRoll.d2,
          finalRoll.d3,
          finalRoll.d4,
        ];

        finalAnimationState.currentValues = finalCurrentValues;

        finalAnimationState.scrollPositions = [
          (finalRoll.d1 - 1 + 6) * 44, // Позиция из второго блока
          (finalRoll.d2 - 1 + 6) * 44,
          (finalRoll.d3 - 1 + 6) * 44,
          (finalRoll.d4 - 1 + 6) * 44,
        ];
        finalAnimationState.isAnimating = false;

        // Полностью замораживаем состояние после завершения анимации
        // Устанавливаем финальные значения без реактивности
        const finalState = {
          currentValues: finalCurrentValues,
          isAnimating: false,
          animationStep: 60,
          initialValues: finalAnimationState.initialValues,
          scrollPositions: [
            (finalRoll.d1 - 1 + 6) * 44,
            (finalRoll.d2 - 1 + 6) * 44,
            (finalRoll.d3 - 1 + 6) * 44,
            (finalRoll.d4 - 1 + 6) * 44,
          ],
        };

        // Принудительно устанавливаем финальное состояние
        diceAnimationState.value[diceId] = {
          ...finalState,
          completed: true, // Блокируем любые дальнейшие изменения
        };

        // Вызываем onComplete без задержки
        onComplete();
      }
    };

    // Запускаем анимацию
    requestAnimationFrame(animate);
  };

  // Параллельная анимация всех кубиков
  const animateAllDice = (pool: DicePoolItem[]): void => {
    let completedCount = 0;

    const totalDice = pool.length;

    pool.forEach((item) => {
      animateDiceRoll(item.id, item.roll, () => {
        completedCount++;

        if (completedCount === totalDice) {
          // Все кубики завершили анимацию
        }
      });
    });
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

    // Полностью очищаем все состояния перед новым броском
    diceAnimationState.value = {};
    initialRandomValues.value = {};

    // Запускаем анимацию
    animateAllDice(nextPool);
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

  // Получить позицию прокрутки для эффекта барабана
  const getScrollPosition = (item: DicePoolItem, dieIndex: number): number => {
    const animationState = diceAnimationState.value[item.id];

    // Для полностью завершенных анимаций - абсолютная стабильность
    if (animationState?.completed && animationState.scrollPositions) {
      return animationState.scrollPositions[dieIndex] || 0;
    }

    // Во время анимации используем текущие позиции
    if (animationState && animationState.scrollPositions) {
      return animationState.scrollPositions[dieIndex] || 0;
    }

    // Для начального состояния генерируем стабильные позиции
    const seed = item.id.charCodeAt(0) + dieIndex;
    const randomValue = (seed % 6) + 1;

    return (randomValue - 1) * 44;
  };

  const maxTotal = computed<number | null>(() => {
    if (dicePool.value.length === 0) {
      return null;
    }

    return Math.max(...dicePool.value.map((i) => i.roll.total));
  });

  // Проверяем, были ли брошены кубики
  const hasRolledDice = computed(() => dicePool.value.length > 0);

  // Общая сумма всех результатов (показывается в 2 раза раньше)
  const totalSum = computed(() => {
    if (!hasRolledDice.value) return 0;

    // Проверяем, прошло ли достаточно времени (половина анимации)
    const hasEnoughTime = dicePool.value.some(
      (item) => (diceAnimationState.value[item.id]?.animationStep || 0) > 30,
    );

    if (!hasEnoughTime) return 0;

    return dicePool.value.reduce((sum, item) => sum + item.roll.total, 0);
  });

  const dieClass = (
    index: 0 | 1 | 2 | 3,
    roll: DiceRoll,
    itemId?: string,
  ): string[] => {
    // Проверяем, завершена ли анимация для этого блока или прошло достаточно времени
    const animationState = itemId ? diceAnimationState.value[itemId] : null;
    const isCompleted = animationState?.completed;
    const animationStep = animationState?.animationStep || 0;

    // Подсветка наименьшего кубика появляется в 2 раза раньше (через половину анимации)
    if ((isCompleted || animationStep > 30) && roll.droppedIndex === index) {
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
          <template v-if="!hasRolledDice">
            Сначала бросьте <span class="font-mono">4к6</span> шесть раз, затем
            распределите результаты по характеристикам.
          </template>

          <template v-else>
            Распределите результаты по характеристикам.
            <span
              v-if="totalSum > 0"
              class="ml-2 font-semibold text-primary"
            >
              Общая сумма: {{ totalSum }}
            </span>
          </template>
        </div>

        <UButton
          size="sm"
          :disabled="isButtonDisabled"
          @click="rollDicePool"
        >
          Бросить
        </UButton>
      </div>

      <div
        v-if="dicePool.length === 0"
        class="rounded-xl border border-default p-4 text-sm text-secondary"
      >
        Нажмите «Бросить», чтобы получить 6 значений.
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
            :class="
              (diceAnimationState[item.id]?.completed ||
                (diceAnimationState[item.id]?.animationStep || 0) > 30) &&
              item.roll.total === 18
                ? 'border-green-500 bg-green-50 ring-2 ring-green-500 dark:bg-green-900/20'
                : ''
            "
          >
            <div class="flex items-center justify-between gap-3">
              <USelect
                :model-value="
                  (Object.keys(diceAssign).find(
                    (a) => diceAssign[a as Ability] === item.id,
                  ) as Ability) || null
                "
                :items="getAbilitySelectItemsForDice(item.id)"
                class="w-64 flex-shrink-0"
                :disabled="!isReady"
                placeholder="Выберите характеристику"
                @update:model-value="
                  (v: Ability | null) => {
                    setDiceAssignment(item.id, v);
                  }
                "
              />

              <div
                v-if="
                  diceAnimationState[item.id]?.completed ||
                  (diceAnimationState[item.id]?.animationStep || 0) > 30
                "
                class="flex-1 text-right text-lg font-semibold"
              >
                {{ item.roll.total }}
                <span class="text-sm text-secondary"
                  >(Мод {{ modifierLabel(item.roll.total) }})
                </span>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-around gap-1">
              <div
                :class="dieClass(0, item.roll, item.id)"
                class="relative overflow-hidden"
                :style="diceContainerStyle"
              >
                <div
                  class="absolute inset-0 flex flex-col gap-0"
                  :class="
                    diceAnimationState[item.id]?.isAnimating
                      ? 'transition-transform duration-75 ease-out'
                      : ''
                  "
                  :style="{
                    transform: `translateY(${-getScrollPosition(item, 0)}px)`,
                  }"
                >
                  <!-- Повторяем числа несколько раз для плавной бесконечной прокрутки -->
                  <div
                    v-for="(num, index) in [
                      1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6,
                    ]"
                    :key="`${num}-${index}`"
                    class="flex flex-shrink-0 items-center justify-center"
                    :style="diceItemStyle"
                  >
                    <D6Icon
                      :value="num as D6"
                      :size="DICE_ICON_SIZE"
                    />
                  </div>
                </div>
              </div>

              <div
                :class="dieClass(1, item.roll, item.id)"
                class="relative overflow-hidden"
                :style="diceContainerStyle"
              >
                <div
                  class="absolute inset-0 flex flex-col gap-0"
                  :class="
                    diceAnimationState[item.id]?.isAnimating
                      ? 'transition-transform duration-75 ease-out'
                      : ''
                  "
                  :style="{
                    transform: `translateY(${-getScrollPosition(item, 1)}px)`,
                  }"
                >
                  <!-- Повторяем числа несколько раз для плавной бесконечной прокрутки -->
                  <div
                    v-for="(num, index) in [
                      1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6,
                    ]"
                    :key="`${num}-${index}`"
                    class="flex flex-shrink-0 items-center justify-center"
                    :style="diceItemStyle"
                  >
                    <D6Icon
                      :value="num as D6"
                      :size="DICE_ICON_SIZE"
                    />
                  </div>
                </div>
              </div>

              <div
                :class="dieClass(2, item.roll, item.id)"
                class="relative overflow-hidden"
                :style="diceContainerStyle"
              >
                <div
                  class="absolute inset-0 flex flex-col gap-0"
                  :class="
                    diceAnimationState[item.id]?.isAnimating
                      ? 'transition-transform duration-75 ease-out'
                      : ''
                  "
                  :style="{
                    transform: `translateY(${-getScrollPosition(item, 2)}px)`,
                  }"
                >
                  <!-- Повторяем числа несколько раз для плавной бесконечной прокрутки -->
                  <div
                    v-for="(num, index) in [
                      1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6,
                    ]"
                    :key="`${num}-${index}`"
                    class="flex flex-shrink-0 items-center justify-center"
                    :style="diceItemStyle"
                  >
                    <D6Icon
                      :value="num as D6"
                      :size="DICE_ICON_SIZE"
                    />
                  </div>
                </div>
              </div>

              <div
                :class="dieClass(3, item.roll, item.id)"
                class="relative overflow-hidden"
                :style="diceContainerStyle"
              >
                <div
                  class="absolute inset-0 flex flex-col gap-0"
                  :class="
                    diceAnimationState[item.id]?.isAnimating
                      ? 'transition-transform duration-75 ease-out'
                      : ''
                  "
                  :style="{
                    transform: `translateY(${-getScrollPosition(item, 3)}px)`,
                  }"
                >
                  <!-- Повторяем числа несколько раз для плавной бесконечной прокрутки -->
                  <div
                    v-for="(num, index) in [
                      1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6,
                    ]"
                    :key="`${num}-${index}`"
                    class="flex flex-shrink-0 items-center justify-center"
                    :style="diceItemStyle"
                  >
                    <D6Icon
                      :value="num as D6"
                      :size="DICE_ICON_SIZE"
                    />
                  </div>
                </div>
              </div>
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
