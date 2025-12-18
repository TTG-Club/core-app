<script setup lang="ts">
  import { SelectClass, SelectLevel } from '~ui/select';
  import { UiDrawer } from '~ui/drawer';

  import type { ClassLinkResponse } from '~classes/types';
  import type { NameResponse } from '~/shared/types';
  import type { SelectMenuItem } from '#ui/components/SelectMenu.vue';

  const { currentUrl, currentParent = undefined } = defineProps<{
    currentUrl: string;
    currentName: NameResponse;
    currentParent?: ClassLinkResponse;
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  // Первая строка: текущий класс/подкласс и уровень
  const currentLevel = ref<number>(1);

  // Определяем базовый URL основного класса
  const initialMainClassUrl = computed(() =>
    currentParent ? currentParent.url : currentUrl,
  );

  // Основной класс (можно выбрать)
  const currentClassUrl = ref<string>(
    currentParent ? currentParent.url : currentUrl,
  );

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
  const currentSubclassUrl = ref<string | undefined>(
    currentParent ? currentUrl : undefined,
  );

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

  // Получение подклассов для основного класса
  const { data: currentClassSubclasses } = await useAsyncData<
    Array<ClassLinkResponse>
  >(
    computed(() => `class-${currentClassUrl.value}-subclasses`),
    () => {
      if (!currentClassUrl.value) {
        return Promise.resolve([]);
      }

      return $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${currentClassUrl.value}/subclasses`,
      );
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

      return $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${selectedClassUrl.value}/subclasses`,
      );
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
      const subclasses = await $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${classUrl}/subclasses`,
      );

      additionalClassSubclasses.value[classId] = subclasses;
    } catch {
      additionalClassSubclasses.value[classId] = [];
    }
  }

  // Получение подклассов для дополнительного класса в формате SelectMenu
  function getAdditionalClassSubclassItems(
    classId: string,
  ): Array<SelectMenuItem> {
    const subclasses = additionalClassSubclasses.value[classId] ?? [];

    return subclasses.map((subclass) => ({
      ...subclass,
      label: `${subclass.name.rus} [${subclass.name.eng}]`,
      value: subclass.url,
    }));
  }

  // Преобразование подклассов основного класса в формат для SelectMenu
  const currentClassSubclassItems = computed<Array<SelectMenuItem>>(() => {
    if (!currentClassSubclasses.value?.length) {
      return [];
    }

    return currentClassSubclasses.value.map((subclass) => ({
      ...subclass,
      label: `${subclass.name.rus} [${subclass.name.eng}]`,
      value: subclass.url,
    }));
  });

  // Преобразование подклассов в формат для SelectMenu
  const subclassItems = computed<Array<SelectMenuItem>>(() => {
    if (!availableSubclasses.value?.length) {
      return [];
    }

    return availableSubclasses.value.map((subclass) => ({
      ...subclass,
      label: `${subclass.name.rus} [${subclass.name.eng}]`,
      value: subclass.url,
    }));
  });

  // Сброс подкласса при смене основного класса
  watch(currentClassUrl, () => {
    currentSubclassUrl.value = undefined;
  });

  // Сброс подкласса при смене второго класса
  watch(selectedClassUrl, () => {
    selectedSubclassUrl.value = undefined;
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
    const index = additionalClasses.value.findIndex((c) => c.id === id);

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
      additionalClasses.value.map((c) => ({ id: c.id, classUrl: c.classUrl })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, classUrl }) => {
        const oldValue = oldValues?.find((o) => o.id === id);

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
      additionalClasses.value.map((c) => ({ id: c.id, classUrl: c.classUrl })),
    (newValues, oldValues) => {
      newValues.forEach(({ id, classUrl }) => {
        const oldClass = oldValues?.find((o) => o.id === id);

        if (oldClass && oldClass.classUrl !== classUrl) {
          const additionalClass = additionalClasses.value.find(
            (c) => c.id === id,
          );

          if (additionalClass) {
            additionalClass.subclassUrl = undefined;
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
      !currentClassUrl.value ||
      !currentLevel.value ||
      !selectedClassUrl.value ||
      !selectedLevel.value
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
    const url = `/multiclass?${queryString}`;

    // Закрываем drawer и переходим на страницу мультикласса в том же окне
    emit('close');
    navigateTo(url);
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
              !currentClassUrl || currentClassSubclassItems.length === 0
            "
            label-key="label"
            value-key="value"
            clearable
            searchable
            class="flex-1"
          />
        </div>

        <div class="flex items-center gap-3">
          <span class="min-w-20 text-sm text-secondary">Уровень:</span>

          <SelectLevel
            v-model="currentLevel"
            class="w-44"
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

        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <span class="min-w-20 text-sm text-secondary">Класс:</span>

            <SelectClass
              v-model="selectedClassUrl"
              class="flex-1"
            />
          </div>

          <div class="flex items-center gap-3">
            <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

            <USelectMenu
              v-model="selectedSubclassUrl"
              :items="subclassItems"
              :placeholder="'Выбери подкласс'"
              :disabled="!selectedClassUrl || subclassItems.length === 0"
              label-key="label"
              value-key="value"
              clearable
              searchable
              class="flex-1"
            />
          </div>

          <div class="flex items-center gap-3">
            <span class="min-w-20 text-sm text-secondary">Уровень:</span>

            <SelectLevel
              v-model="selectedLevel"
              class="w-44"
            />
          </div>
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
              removeAdditionalClass(additionalClass.id)
            "
          >
            Удалить
          </UButton>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <span class="min-w-20 text-sm text-secondary">Класс:</span>

            <SelectClass
              v-model="additionalClass.classUrl"
              class="flex-1"
            />
          </div>

          <div class="flex items-center gap-3">
            <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

            <USelectMenu
              v-model="additionalClass.subclassUrl"
              :items="getAdditionalClassSubclassItems(additionalClass.id)"
              :placeholder="'Выбери подкласс'"
              :disabled="
                !additionalClass.classUrl ||
                getAdditionalClassSubclassItems(additionalClass.id).length === 0
              "
              label-key="label"
              value-key="value"
              clearable
              searchable
              class="flex-1"
            />
          </div>

          <div class="flex items-center gap-3">
            <span class="min-w-20 text-sm text-secondary">Уровень:</span>

            <SelectLevel
              v-model="additionalClass.level"
              class="w-44"
            />
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-between gap-2 pt-4">
        <UButton
          variant="link"
          :disabled="additionalClasses.length >= 9"
          class="!p-0"
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
