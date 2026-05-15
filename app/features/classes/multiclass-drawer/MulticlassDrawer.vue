<script setup lang="ts">
  import type { NameResponse } from '~/shared/types';

  import type { ClassLinkResponse } from '../model';

  import { UiDrawer } from '~ui/drawer';
  import { SelectClass, SelectLevel, SelectSubclass } from '~ui/select';

  import {
    MULTICLASS_DRAWER_CURRENT_CLASS_ID,
    MULTICLASS_DRAWER_SELECTED_CLASS_ID,
  } from './constants';

  const MAX_CHARACTER_LEVEL = 20;
  const MAX_ADDITIONAL_CLASS_COUNT = 9;

  export interface MulticlassDrawerClassState {
    classUrl: string;
    level: number;
    subclassUrl?: string;
  }

  export interface MulticlassDrawerInitialState {
    /** Основной класс (первый слот) */
    mainClass: MulticlassDrawerClassState;
    /** Дополнительные классы (второй слот и далее) */
    additionalClasses: Array<MulticlassDrawerClassState>;
  }

  const {
    url,
    parent = undefined,
    initialState = undefined,
  } = defineProps<{
    url: string;
    name: NameResponse;
    parent?: ClassLinkResponse;
    initialState?: MulticlassDrawerInitialState;
  }>();

  const emit = defineEmits<{
    (eventName: 'close'): void;
  }>();

  // Определяем базовый URL основного класса
  const initialMainClassUrl = computed(() => (parent ? parent.url : url));

  // Первая строка: текущий класс/подкласс и уровень
  const currentLevel = ref<number>(
    initialState?.mainClass.level ?? (parent ? 3 : 1),
  );

  // Основной класс (можно выбрать)
  const currentClassUrl = ref<string>(
    initialState?.mainClass.classUrl ?? (parent ? parent.url : url),
  );

  // Обновляем currentClassUrl при изменении initialMainClassUrl (только если нет initialState)
  watch(
    initialMainClassUrl,
    (newUrl) => {
      if (!initialState && currentClassUrl.value !== newUrl) {
        currentClassUrl.value = newUrl;
      }
    },
    { immediate: !initialState },
  );

  // Инициализируем подкласс
  const currentSubclassUrl = ref<string | undefined>(
    initialState?.mainClass.subclassUrl ?? (parent ? url : undefined),
  );

  // Второй слот: берём из initialState[0] если есть
  const secondInitial = initialState?.additionalClasses[0];

  const selectedClassUrl = ref<string | undefined>(secondInitial?.classUrl);

  const selectedSubclassUrl = ref<string | undefined>(
    secondInitial?.subclassUrl,
  );

  const selectedLevel = ref<number>(secondInitial?.level ?? 1);

  // Дополнительные классы (3-10)
  interface AdditionalClass {
    id: string;
    classUrl?: string;
    subclassUrl?: string;
    level: number;
  }

  // Инициализируем дополнительные классы из initialState (начиная с индекса 1)
  const additionalClasses = ref<Array<AdditionalClass>>(
    (initialState?.additionalClasses.slice(1) ?? []).map(
      (additionalClassState, index) => ({
        id: `class-init-${index}`,
        classUrl: additionalClassState.classUrl,
        subclassUrl: additionalClassState.subclassUrl,
        level: additionalClassState.level,
      }),
    ),
  );

  // Единый упорядоченный список всех слотов классов
  interface ClassSlot {
    id: string;
    classUrl: string | undefined;
    subclassUrl: string | undefined;
    level: number;
  }

  const allClassSlots = computed<Array<ClassSlot>>(() => {
    const slots: Array<ClassSlot> = [
      {
        id: MULTICLASS_DRAWER_CURRENT_CLASS_ID,
        classUrl: currentClassUrl.value,
        subclassUrl: currentSubclassUrl.value,
        level: currentLevel.value,
      },
      {
        id: MULTICLASS_DRAWER_SELECTED_CLASS_ID,
        classUrl: selectedClassUrl.value,
        subclassUrl: selectedSubclassUrl.value,
        level: selectedLevel.value,
      },
      ...additionalClasses.value.map((additionalClass) => ({
        id: additionalClass.id,
        classUrl: additionalClass.classUrl,
        subclassUrl: additionalClass.subclassUrl,
        level: additionalClass.level,
      })),
    ];

    return slots;
  });

  function getClassMaxLevelTotal(slots: Array<ClassSlot>): number {
    const classMaxLevels = new Map<string, number>();

    for (const slot of slots) {
      if (!slot.classUrl) {
        continue;
      }

      const currentMaxLevel = classMaxLevels.get(slot.classUrl);

      if (currentMaxLevel === undefined || slot.level > currentMaxLevel) {
        classMaxLevels.set(slot.classUrl, slot.level);
      }
    }

    let totalLevel = 0;

    for (const level of classMaxLevels.values()) {
      totalLevel += level;
    }

    return totalLevel;
  }

  const effectiveCharacterLevel = computed(() =>
    getClassMaxLevelTotal(allClassSlots.value),
  );

  const isAddClassDisabled = computed(
    () =>
      additionalClasses.value.length >= MAX_ADDITIONAL_CLASS_COUNT
      || effectiveCharacterLevel.value >= MAX_CHARACTER_LEVEL,
  );

  /**
   * Возвращает выбранные классы соседних слотов.
   */
  function getAdjacentClassUrls(slotId: string): Array<string> {
    const slots = allClassSlots.value;
    const slotIndex = slots.findIndex((slot) => slot.id === slotId);

    if (slotIndex === -1) {
      return [];
    }

    const previousClassUrl = slots[slotIndex - 1]?.classUrl;
    const nextClassUrl = slots[slotIndex + 1]?.classUrl;

    return [previousClassUrl, nextClassUrl].filter(
      (classUrl): classUrl is string =>
        typeof classUrl === 'string' && classUrl.length > 0,
    );
  }

  /**
   * Проверяет, есть ли в текущей последовательности два одинаковых класса подряд.
   */
  function hasAdjacentDuplicateClassSlots(): boolean {
    return allClassSlots.value.some((slot, slotIndex) => {
      const nextSlot = allClassSlots.value[slotIndex + 1];

      return !!slot.classUrl && slot.classUrl === nextSlot?.classUrl;
    });
  }

  /**
   * Возвращает предыдущий слот с тем же classUrl для данного слота.
   * Используется для определения ограничений повторно выбранного класса.
   */
  function getPreviousSameClassSlot(slotId: string): ClassSlot | undefined {
    const slots = allClassSlots.value;
    const currentIndex = slots.findIndex((slot) => slot.id === slotId);

    if (currentIndex <= 0) {
      return undefined;
    }

    const currentSlot = slots[currentIndex];

    if (!currentSlot?.classUrl) {
      return undefined;
    }

    // Ищем предыдущий слот с тем же classUrl среди слотов до текущего
    for (let index = currentIndex - 1; index >= 0; index--) {
      const slot = slots[index];

      if (slot && slot.classUrl === currentSlot.classUrl) {
        return slot;
      }
    }

    return undefined;
  }

  function getMinLevelForSlot(slotId: string): number {
    const previousSlot = getPreviousSameClassSlot(slotId);

    if (!previousSlot) {
      return 1;
    }

    return previousSlot.level + 1;
  }

  /**
   * Возвращает унаследованный подкласс для повторного слота.
   * Если класс выбран повторно и у предыдущего вхождения есть подкласс,
   * повторный слот обязан использовать тот же подкласс.
   */
  function getInheritedSubclassForSlot(slotId: string): string | undefined {
    const previousSlot = getPreviousSameClassSlot(slotId);

    return previousSlot?.subclassUrl;
  }

  /**
   * Подкласс заблокирован для повторного класса, если подкласс уже был выбран
   * в предыдущем вхождении этого класса (он наследуется автоматически).
   * Также заблокирован если уровень <= 2 или класс не выбран.
   */
  function isSubclassDisabledForSlot(
    slotId: string,
    level: number,
    classUrl: string | undefined,
  ): boolean {
    if (!classUrl || level <= 2) {
      return true;
    }

    // Если есть унаследованный подкласс — поле заблокировано (значение проставлено автоматически)
    return getInheritedSubclassForSlot(slotId) !== undefined;
  }

  function getEffectiveUsedLevels(excludeSlotId: string): number {
    const slots = allClassSlots.value;
    const classMaxLevels = new Map<string, number>();
    const excludedSlot = slots.find((slot) => slot.id === excludeSlotId);

    for (const slot of slots) {
      if (slot.id === excludeSlotId || !slot.classUrl) {
        continue;
      }

      if (excludedSlot?.classUrl === slot.classUrl) {
        continue;
      }

      const existing = classMaxLevels.get(slot.classUrl);

      if (existing === undefined || slot.level > existing) {
        classMaxLevels.set(slot.classUrl, slot.level);
      }
    }

    let totalUsed = 0;

    for (const level of classMaxLevels.values()) {
      totalUsed += level;
    }

    return totalUsed;
  }

  // Максимальный доступный уровень для основного класса
  const maxCurrentLevel = computed(() => {
    const usedByOthers = getEffectiveUsedLevels(
      MULTICLASS_DRAWER_CURRENT_CLASS_ID,
    );

    const available = MAX_CHARACTER_LEVEL - usedByOthers;

    return Math.max(1, Math.min(available, MAX_CHARACTER_LEVEL));
  });

  // Максимальный доступный уровень для второго класса
  const maxSelectedLevel = computed(() => {
    const usedByOthers = getEffectiveUsedLevels(
      MULTICLASS_DRAWER_SELECTED_CLASS_ID,
    );

    const available = MAX_CHARACTER_LEVEL - usedByOthers;

    return Math.max(1, Math.min(available, MAX_CHARACTER_LEVEL));
  });

  // Функция для вычисления максимального уровня для дополнительного класса
  function getMaxLevelForAdditionalClass(classId: string): number {
    const usedByOthers = getEffectiveUsedLevels(classId);
    const available = MAX_CHARACTER_LEVEL - usedByOthers;

    return Math.max(1, Math.min(available, MAX_CHARACTER_LEVEL));
  }

  // Сброс/наследование подкласса при смене основного класса
  watch(currentClassUrl, () => {
    currentSubclassUrl.value = getInheritedSubclassForSlot(
      MULTICLASS_DRAWER_CURRENT_CLASS_ID,
    );
  });

  // Корректировка уровня основного класса, если он превышает доступный максимум
  watch(maxCurrentLevel, (maxLevel) => {
    if (currentLevel.value > maxLevel) {
      currentLevel.value = maxLevel;
    }
  });

  // Корректировка уровня второго класса, если он превышает доступный максимум
  watch(maxSelectedLevel, (maxLevel) => {
    if (selectedClassUrl.value && selectedLevel.value > maxLevel) {
      selectedLevel.value = maxLevel;
    }
  });

  // Сброс подкласса при смене уровня основного класса (если уровень <= 2)
  watch(currentLevel, (newLevel) => {
    if (newLevel <= 2) {
      currentSubclassUrl.value = undefined;
    }
  });

  // Сброс/наследование подкласса при смене второго класса
  watch(selectedClassUrl, () => {
    selectedSubclassUrl.value = getInheritedSubclassForSlot(
      MULTICLASS_DRAWER_SELECTED_CLASS_ID,
    );
  });

  // Сброс подкласса при смене уровня второго класса (если уровень <= 2)
  watch(selectedLevel, (newLevel) => {
    if (newLevel <= 2) {
      selectedSubclassUrl.value = undefined;
    }
  });

  // Обработчик нажатия на кнопку "Добавить класс"
  function handleAddClass() {
    if (isAddClassDisabled.value) {
      return;
    }

    additionalClasses.value.push({
      id: `class-${Date.now()}`,
      level: 1,
    });
  }

  // Удаление дополнительного класса
  function removeAdditionalClass(id: string) {
    const index = additionalClasses.value.findIndex(
      (additionalClass) => additionalClass.id === id,
    );

    if (index !== -1) {
      additionalClasses.value.splice(index, 1);
    }
  }

  function handleRemoveAdditionalClass(classId: string) {
    removeAdditionalClass(classId);
  }

  // Сброс/наследование подкласса при смене класса для дополнительных классов
  watch(
    () =>
      additionalClasses.value.map((additionalClass) => ({
        id: additionalClass.id,
        classUrl: additionalClass.classUrl,
      })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, classUrl }) => {
        const previousClass = oldValues?.find(
          (previousValue) => previousValue.id === id,
        );

        if (previousClass && previousClass.classUrl !== classUrl) {
          const additionalClass = additionalClasses.value.find(
            (additionalClassItem) => additionalClassItem.id === id,
          );

          if (additionalClass) {
            // Наследуем подкласс от предыдущего вхождения того же класса (или сбрасываем)
            additionalClass.subclassUrl = getInheritedSubclassForSlot(id);
          }
        }
      });
    },
    { deep: true },
  );

  // Сброс подкласса при смене уровня для дополнительных классов (если уровень <= 2)
  watch(
    () =>
      additionalClasses.value.map((additionalClass) => ({
        id: additionalClass.id,
        level: additionalClass.level,
      })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, level }) => {
        const oldValue = oldValues?.find(
          (previousValue) => previousValue.id === id,
        );

        if (oldValue && oldValue.level !== level && level <= 2) {
          const additionalClass = additionalClasses.value.find(
            (additionalClassItem) => additionalClassItem.id === id,
          );

          if (additionalClass) {
            additionalClass.subclassUrl = undefined;
          }
        }
      });
    },
    { deep: true },
  );

  // Корректировка уровней дополнительных классов, если они превышают доступный максимум
  watch(
    () => [
      currentLevel.value,
      selectedLevel.value,
      additionalClasses.value.map((additionalClass) => ({
        id: additionalClass.id,
        level: additionalClass.level,
      })),
    ],
    () => {
      additionalClasses.value.forEach((additionalClass) => {
        if (additionalClass.classUrl) {
          const maxLevel = getMaxLevelForAdditionalClass(additionalClass.id);

          if (additionalClass.level > maxLevel) {
            additionalClass.level = maxLevel;
          }
        }
      });
    },
    { deep: true },
  );

  // Обработчик нажатия на кнопку "Очистить"
  function handleClear() {
    selectedClassUrl.value = undefined;
    selectedSubclassUrl.value = undefined;
    selectedLevel.value = 1;
    additionalClasses.value = [];
  }

  // Обработчик нажатия на кнопку "Применить"
  function handleApply() {
    if (
      !currentClassUrl.value
      || !currentLevel.value
      || !selectedClassUrl.value
      || !selectedLevel.value
      || hasAdjacentDuplicateClassSlots()
    ) {
      return;
    }

    const class1BaseUrl = currentClassUrl.value;
    const class1SubclassUrl = currentSubclassUrl.value;

    const query: Record<string, string> = {
      class1: class1BaseUrl,
      level1: String(currentLevel.value),
      class2: selectedClassUrl.value,
      level2: String(selectedLevel.value),
    };

    if (class1SubclassUrl) {
      query.subclass1 = class1SubclassUrl;
    }

    if (selectedSubclassUrl.value) {
      query.subclass2 = selectedSubclassUrl.value;
    }

    additionalClasses.value.forEach((additionalClass, index) => {
      if (additionalClass.classUrl) {
        const classNumber = index + 3;

        query[`class${classNumber}`] = additionalClass.classUrl;
        query[`level${classNumber}`] = String(additionalClass.level);

        if (additionalClass.subclassUrl) {
          query[`subclass${classNumber}`] = additionalClass.subclassUrl;
        }
      }
    });

    const queryString = new URLSearchParams(query).toString();
    const multiclassUrl = `/multiclass?${queryString}`;

    emit('close');
    navigateTo(multiclassUrl);
  }
</script>

<template>
  <UiDrawer
    title="Создать мультикласс"
    class="w-lg"
    @close="$emit('close')"
  >
    <div class="flex flex-col gap-6">
      <!-- Первая строка: текущий класс/подкласс и уровень -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-highlighted">
            Основной класс:
          </span>
        </div>

        <div
          class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
        >
          <span class="min-w-20 text-sm text-secondary">Класс:</span>

          <SelectClass
            v-model="currentClassUrl"
            :excluded-values="
              getAdjacentClassUrls(MULTICLASS_DRAWER_CURRENT_CLASS_ID)
            "
            class="min-w-0"
          />

          <SelectLevel
            v-model="currentLevel"
            :min="getMinLevelForSlot(MULTICLASS_DRAWER_CURRENT_CLASS_ID)"
            :max="maxCurrentLevel"
            class="col-start-2 w-36 sm:col-start-auto"
          />
        </div>

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

          <SelectSubclass
            v-model="currentSubclassUrl"
            :class-url="currentClassUrl"
            :disabled="
              isSubclassDisabledForSlot(
                MULTICLASS_DRAWER_CURRENT_CLASS_ID,
                currentLevel,
                currentClassUrl,
              )
            "
            class="flex-1"
          />
        </div>
      </div>

      <!-- Вторая строка: выбор класса, подкласса и уровня -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-highlighted">
            Добавить класс:
          </span>
        </div>

        <div
          class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
        >
          <span class="min-w-20 text-sm text-secondary">Класс:</span>

          <SelectClass
            v-model="selectedClassUrl"
            :excluded-values="
              getAdjacentClassUrls(MULTICLASS_DRAWER_SELECTED_CLASS_ID)
            "
            class="min-w-0"
          />

          <SelectLevel
            v-model="selectedLevel"
            :min="getMinLevelForSlot(MULTICLASS_DRAWER_SELECTED_CLASS_ID)"
            :max="maxSelectedLevel"
            class="col-start-2 w-36 sm:col-start-auto"
          />
        </div>

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

          <SelectSubclass
            v-model="selectedSubclassUrl"
            :class-url="selectedClassUrl"
            :disabled="
              isSubclassDisabledForSlot(
                MULTICLASS_DRAWER_SELECTED_CLASS_ID,
                selectedLevel,
                selectedClassUrl,
              )
            "
            class="flex-1"
          />
        </div>
      </div>

      <!-- Дополнительные классы (3-10) -->
      <div
        v-for="(additionalClass, index) in additionalClasses"
        :key="additionalClass.id"
        class="flex flex-col gap-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-highlighted">
            Класс {{ index + 3 }}:
          </span>

          <UButton
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="
              handleRemoveAdditionalClass(additionalClass.id)
            "
          >
            Удалить
          </UButton>
        </div>

        <div
          class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
        >
          <span class="min-w-20 text-sm text-secondary">Класс:</span>

          <SelectClass
            v-model="additionalClass.classUrl"
            :excluded-values="getAdjacentClassUrls(additionalClass.id)"
            class="min-w-0"
          />

          <SelectLevel
            v-model="additionalClass.level"
            :min="getMinLevelForSlot(additionalClass.id)"
            :max="getMaxLevelForAdditionalClass(additionalClass.id)"
            class="col-start-2 w-36 sm:col-start-auto"
          />
        </div>

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

          <SelectSubclass
            v-model="additionalClass.subclassUrl"
            :class-url="additionalClass.classUrl"
            :disabled="
              isSubclassDisabledForSlot(
                additionalClass.id,
                additionalClass.level,
                additionalClass.classUrl,
              )
            "
            class="flex-1"
          />
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-between gap-2 pt-4">
        <UButton
          variant="link"
          :disabled="isAddClassDisabled"
          class="p-0!"
          @click.left.exact.prevent="handleAddClass()"
        >
          Добавить класс
        </UButton>

        <div class="flex gap-2">
          <UButton
            variant="ghost"
            @click.left.exact.prevent="handleClear()"
          >
            Очистить
          </UButton>

          <UButton
            :disabled="
              !selectedClassUrl
              || !selectedLevel
              || hasAdjacentDuplicateClassSlots()
            "
            @click.left.exact.prevent="handleApply()"
          >
            Создать
          </UButton>
        </div>
      </div>
    </div>
  </UiDrawer>
</template>
