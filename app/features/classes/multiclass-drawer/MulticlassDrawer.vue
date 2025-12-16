<script setup lang="ts">
  import { SelectClass, SelectLevel } from '~ui/select';
  import { UiDrawer } from '~ui/drawer';
  import { getOrigin } from '~/utils/getOrigin';

  import type { ClassLinkResponse } from '~classes/types';
  import type { NameResponse } from '~/shared/types';
  import type { SelectMenuItem } from '#ui/components/SelectMenu.vue';

  const {
    currentUrl,
    currentName,
    currentParent = undefined,
  } = defineProps<{
    currentUrl: string;
    currentName: NameResponse;
    currentParent?: ClassLinkResponse;
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  // Первая строка: текущий класс/подкласс и уровень
  const currentLevel = ref<number>(1);

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

  // Сброс подкласса при смене класса
  watch(selectedClassUrl, () => {
    selectedSubclassUrl.value = undefined;
  });

  // Отображение текущего класса/подкласса
  const currentClassDisplay = computed(() => {
    if (currentParent) {
      return `${currentParent.name.rus} / ${currentName.rus}`;
    }

    return currentName.rus;
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
      !currentLevel.value ||
      !selectedClassUrl.value ||
      !selectedLevel.value
    ) {
      return;
    }

    // Определяем базовый URL для первого класса
    // Если есть parent, значит текущий класс - это подкласс
    const class1BaseUrl = currentParent ? currentParent.url : currentUrl;
    const class1FinalUrl = currentParent ? currentUrl : currentUrl;

    // Формируем URL для страницы мультикласса
    const query: Record<string, string> = {
      class1: class1BaseUrl,
      level1: String(currentLevel.value),
      class2: selectedClassUrl.value,
      level2: String(selectedLevel.value),
    };

    // Если текущий класс - это подкласс, добавляем его URL
    if (currentParent) {
      query.subclass1 = class1FinalUrl;
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
    const url = `${getOrigin()}/multiclass?${queryString}`;

    // Закрываем drawer и открываем страницу в новой вкладке
    emit('close');
    window.open(url, '_blank');
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
            Текущий класс:
          </span>

          <span class="text-sm">{{ currentClassDisplay }}</span>
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
