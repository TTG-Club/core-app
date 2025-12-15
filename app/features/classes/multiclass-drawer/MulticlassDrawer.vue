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
  const currentLevel = ref<number>();

  // Вторая строка: выбор класса, подкласса и уровня
  const selectedClassUrl = ref<string>();
  const selectedSubclassUrl = ref<string>();
  const selectedLevel = ref<number>();

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
    class="w-xl"
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

        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <span class="min-w-20 text-sm text-secondary">Класс:</span>

            <SelectClass
              v-model="selectedClassUrl"
              class="flex-1"
            />
          </div>

          <div
            v-if="subclassItems.length > 0"
            class="flex items-center gap-3"
          >
            <span class="min-w-20 text-sm text-secondary">Подкласс:</span>

            <USelectMenu
              v-model="selectedSubclassUrl"
              :items="subclassItems"
              :placeholder="'Выбери подкласс'"
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
              class="flex-1"
            />
          </div>
        </div>
      </div>

      <!-- Кнопка "Применить" -->
      <div class="flex justify-end gap-2 border-t border-default pt-4">
        <UButton @click.left.exact.prevent="handleApply()"> Применить </UButton>
      </div>
    </div>
  </UiDrawer>
</template>
