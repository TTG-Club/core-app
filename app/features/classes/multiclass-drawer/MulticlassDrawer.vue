<script setup lang="ts">
  import type { SelectMenuItem } from '#ui/components/SelectMenu.vue';
  import type { NameResponse } from '~/shared/types';

  import type { ClassLinkResponse } from '../model';

  import { UiDrawer } from '~ui/drawer';
  import { SelectClass, SelectLevel } from '~ui/select';

  import { parseClassLinkResponseArray } from '../model';

  const { url, parent = undefined } = defineProps<{
    url: string;
    name: NameResponse;
    parent?: ClassLinkResponse;
  }>();

  const emit = defineEmits<{
    (eventName: 'close'): void;
  }>();

  // Первая строка: текущий класс/подкласс и уровень
  const currentLevel = ref<number>(1);

  // Определяем базовый URL основного класса
  const initialMainClassUrl = computed(() => (parent ? parent.url : url));

  // Основной класс (можно выбрать)
  const currentClassUrl = ref<string>(parent ? parent.url : url);

  // Обновляем currentClassUrl при изменении initialMainClassUrl
  watch(
    initialMainClassUrl,
    (newUrl) => {
      if (currentClassUrl.value !== newUrl) {
        currentClassUrl.value = newUrl;
      }
    },
    { immediate: true },
  );

  // Инициализируем подкласс: если мы на странице подкласса, используем его URL
  const currentSubclassUrl = ref<string | undefined>(parent ? url : undefined);

  // Вторая строка: выбор класса, подкласса и уровня
  const selectedClassUrl = ref<string>();
  const selectedSubclassUrl = ref<string>();
  const selectedLevel = ref<number>(1);

  // Дополнительные классы (3-10)
  interface AdditionalClass {
    id: string;
    classUrl?: string;
    subclassUrl?: string;
    level: number;
  }

  const additionalClasses = ref<Array<AdditionalClass>>([]);

  async function fetchSubclassLinks(
    classUrl: string,
  ): Promise<Array<ClassLinkResponse>> {
    const response = await $fetch(`/api/v2/classes/${classUrl}/subclasses`);

    return parseClassLinkResponseArray(response);
  }

  function createSubclassSelectItems(
    subclasses: Array<ClassLinkResponse> | undefined,
  ): Array<SelectMenuItem> {
    if (!subclasses?.length) {
      return [];
    }

    return subclasses.map((subclass) => ({
      ...subclass,
      label: `${subclass.name.rus} [${subclass.name.eng}]`,
      value: subclass.url,
    }));
  }

  function resetAdditionalSubclass(classId: string) {
    const additionalClass = additionalClasses.value.find(
      (additionalClassItem) => additionalClassItem.id === classId,
    );

    if (additionalClass) {
      additionalClass.subclassUrl = undefined;
    }
  }

  function handleRemoveAdditionalClass(classId: string) {
    removeAdditionalClass(classId);
  }

  // Получение подклассов для основного класса
  const { data: currentClassSubclasses } = await useAsyncData<
    Array<ClassLinkResponse>
  >(
    computed(() => `class-${currentClassUrl.value}-subclasses`),
    () => {
      if (!currentClassUrl.value) {
        return Promise.resolve([]);
      }

      return fetchSubclassLinks(currentClassUrl.value);
    },
    {
      server: false,
      watch: [currentClassUrl],
    },
  );

  // Получение подклассов для выбранного класса
  const { data: availableSubclasses } = await useAsyncData<
    Array<ClassLinkResponse>
  >(
    computed(() => `class-${selectedClassUrl.value || ''}-subclasses`),
    () => {
      if (!selectedClassUrl.value) {
        return Promise.resolve([]);
      }

      return fetchSubclassLinks(selectedClassUrl.value);
    },
    {
      server: false,
      watch: [selectedClassUrl],
    },
  );

  // Хранилище подклассов для дополнительных классов
  const additionalClassSubclasses = ref<
    Record<string, Array<ClassLinkResponse> | undefined>
  >({});

  // Загрузка подклассов для дополнительного класса
  async function loadSubclassesForAdditionalClass(
    classId: string,
    classUrl: string | undefined,
  ) {
    if (!classUrl) {
      additionalClassSubclasses.value[classId] = [];

      return;
    }

    try {
      additionalClassSubclasses.value[classId] =
        await fetchSubclassLinks(classUrl);
    } catch {
      additionalClassSubclasses.value[classId] = [];
    }
  }

  // Получение подклассов для дополнительного класса в формате SelectMenu
  function getAdditionalClassSubclassItems(
    classId: string,
  ): Array<SelectMenuItem> {
    const subclasses = additionalClassSubclasses.value[classId];

    return createSubclassSelectItems(subclasses);
  }

  // Преобразование подклассов основного класса в формат для SelectMenu
  const currentClassSubclassItems = computed<Array<SelectMenuItem>>(() => {
    return createSubclassSelectItems(currentClassSubclasses.value);
  });

  // Преобразование подклассов в формат для SelectMenu
  const subclassItems = computed<Array<SelectMenuItem>>(() => {
    return createSubclassSelectItems(availableSubclasses.value);
  });

  // Вычисляем сумму уровней дополнительных классов
  const sumAdditionalLevels = computed(() => {
    return additionalClasses.value
      .filter((additionalClass) => additionalClass.classUrl)
      .reduce((sum, additionalClass) => sum + additionalClass.level, 0);
  });

  // Максимальный доступный уровень для основного класса
  const maxCurrentLevel = computed(() => {
    const secondLevel = selectedClassUrl.value ? selectedLevel.value : 0;
    const available = 20 - secondLevel - sumAdditionalLevels.value;

    return Math.max(1, Math.min(available, 20));
  });

  // Максимальный доступный уровень для второго класса
  const maxSelectedLevel = computed(() => {
    const available = 20 - currentLevel.value - sumAdditionalLevels.value;

    return Math.max(1, Math.min(available, 20));
  });

  // Функция для вычисления максимального уровня для дополнительного класса
  function getMaxLevelForAdditionalClass(classId: string): number {
    const currentSum = currentLevel.value;
    const secondSum = selectedClassUrl.value ? selectedLevel.value : 0;

    const otherAdditionalSum = additionalClasses.value
      .filter(
        (additionalClass) =>
          additionalClass.id !== classId && additionalClass.classUrl,
      )
      .reduce((sum, additionalClass) => sum + additionalClass.level, 0);

    const available = 20 - currentSum - secondSum - otherAdditionalSum;

    return Math.max(1, Math.min(available, 20));
  }

  // Сброс подкласса при смене основного класса
  watch(currentClassUrl, () => {
    currentSubclassUrl.value = undefined;
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

  // Сброс подкласса при смене второго класса
  watch(selectedClassUrl, () => {
    selectedSubclassUrl.value = undefined;
  });

  // Сброс подкласса при смене уровня второго класса (если уровень <= 2)
  watch(selectedLevel, (newLevel) => {
    if (newLevel <= 2) {
      selectedSubclassUrl.value = undefined;
    }
  });

  // Обработчик нажатия на кнопку "Добавить класс"
  function handleAddClass() {
    if (additionalClasses.value.length >= 9) {
      // Максимум 10 классов (1 текущий + 1 второй + 8 дополнительных)
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

      // Используем новый объект без удаляемого свойства
      const newSubclasses: Record<
        string,
        Array<ClassLinkResponse> | undefined
      > = {};

      Object.keys(additionalClassSubclasses.value).forEach((key) => {
        if (key !== id) {
          const subclasses = additionalClassSubclasses.value[key];

          if (subclasses !== undefined) {
            newSubclasses[key] = subclasses;
          }
        }
      });

      additionalClassSubclasses.value = newSubclasses;
    }
  }

  // Отслеживание изменений classUrl для дополнительных классов
  watch(
    () =>
      additionalClasses.value.map((additionalClass) => ({
        id: additionalClass.id,
        classUrl: additionalClass.classUrl,
      })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, classUrl }) => {
        const oldValue = oldValues?.find(
          (previousValue) => previousValue.id === id,
        );

        if (classUrl && (!oldValue || oldValue.classUrl !== classUrl)) {
          loadSubclassesForAdditionalClass(id, classUrl);
        } else if (!classUrl) {
          additionalClassSubclasses.value[id] = [];
        }
      });
    },
    { deep: true },
  );

  // Сброс подкласса при смене класса для дополнительных классов
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
          resetAdditionalSubclass(id);
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
          resetAdditionalSubclass(id);
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
    ) {
      return;
    }

    // Используем выбранный основной класс
    const class1BaseUrl = currentClassUrl.value;

    // Используем выбранный подкласс для основного класса
    const class1SubclassUrl = currentSubclassUrl.value;

    // Формируем URL для страницы мультикласса
    const query: Record<string, string> = {
      class1: class1BaseUrl,
      level1: String(currentLevel.value),
      class2: selectedClassUrl.value,
      level2: String(selectedLevel.value),
    };

    // Если выбран подкласс для основного класса, добавляем его URL
    if (class1SubclassUrl) {
      query.subclass1 = class1SubclassUrl;
    }

    // Если выбран подкласс для второго класса, добавляем его URL
    if (selectedSubclassUrl.value) {
      query.subclass2 = selectedSubclassUrl.value;
    }

    // Добавляем дополнительные классы (3-10)
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

    // Закрываем drawer и переходим на страницу мультикласса в том же окне
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

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Класс:</span>

          <SelectClass
            v-model="currentClassUrl"
            class="flex-1"
          />

          <SelectLevel
            v-model="currentLevel"
            :max="maxCurrentLevel"
            class="w-36"
          />
        </div>

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

          <USelectMenu
            v-model="currentSubclassUrl"
            :items="currentClassSubclassItems"
            :placeholder="
              currentClassSubclassItems.length === 0
                ? 'Нет подклассов'
                : 'Выбери подкласс'
            "
            :disabled="
              !currentClassUrl
              || currentClassSubclassItems.length === 0
              || currentLevel <= 2
            "
            label-key="label"
            value-key="value"
            clearable
            searchable
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

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Класс:</span>

          <SelectClass
            v-model="selectedClassUrl"
            class="flex-1"
          />

          <SelectLevel
            v-model="selectedLevel"
            :max="maxSelectedLevel"
            class="w-36"
          />
        </div>

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

          <USelectMenu
            v-model="selectedSubclassUrl"
            :items="subclassItems"
            :placeholder="'Выбери подкласс'"
            :disabled="
              !selectedClassUrl
              || subclassItems.length === 0
              || selectedLevel <= 2
            "
            label-key="label"
            value-key="value"
            clearable
            searchable
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

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Класс:</span>

          <SelectClass
            v-model="additionalClass.classUrl"
            class="flex-1"
          />

          <SelectLevel
            v-model="additionalClass.level"
            :max="getMaxLevelForAdditionalClass(additionalClass.id)"
            class="w-36"
          />
        </div>

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

          <USelectMenu
            v-model="additionalClass.subclassUrl"
            :items="getAdditionalClassSubclassItems(additionalClass.id)"
            :placeholder="'Выбери подкласс'"
            :disabled="
              !additionalClass.classUrl
              || getAdditionalClassSubclassItems(additionalClass.id).length
                === 0
              || additionalClass.level <= 2
            "
            label-key="label"
            value-key="value"
            clearable
            searchable
            class="flex-1"
          />
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-between gap-2 pt-4">
        <UButton
          variant="link"
          :disabled="additionalClasses.length >= 9"
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
            :disabled="!selectedClassUrl || !selectedLevel"
            @click.left.exact.prevent="handleApply()"
          >
            Создать
          </UButton>
        </div>
      </div>
    </div>
  </UiDrawer>
</template>
