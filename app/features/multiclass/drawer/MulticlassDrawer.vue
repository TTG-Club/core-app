<script setup lang="ts">
  import { SelectClass, SelectLevel } from '~ui/select';
  import { UiDrawer } from '~ui/drawer';

  import type { ClassLinkResponse } from '~classes/types';
  import type { NameResponse } from '~/shared/types';
  import {
    useMulticlassDrawer,
    type AdditionalClass,
  } from '~multiclass/composable';

  interface Props {
    url: string;
    name: NameResponse;
    parent?: ClassLinkResponse;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const {
    currentLevel,
    currentClassUrl,
    currentSubclassUrl,
    selectedClassUrl,
    selectedSubclassUrl,
    selectedLevel,
    additionalClasses,
    maxCurrentLevel,
    maxSelectedLevel,
    getMaxLevelForAdditionalClass,
    getAdditionalClassSubclassItems,
    getCurrentClassSubclassItems,
    getSubclassItems,
    handleAddClass,
    removeAdditionalClass,
    handleClear,
    canAddClass,
    isCurrentSubclassDisabled,
    isSelectedSubclassDisabled,
    getAdditionalSubclassDisabled,
    FIRST_ADDITIONAL_CLASS_NUMBER,
  } = useMulticlassDrawer(props);

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

  const currentClassSubclassItems = computed(() =>
    getCurrentClassSubclassItems(currentClassSubclasses.value),
  );

  const subclassItems = computed(() =>
    getSubclassItems(availableSubclasses.value),
  );

  const currentSubclassPlaceholder = computed(() => {
    return currentClassSubclassItems.value.length === 0
      ? 'Нет подклассов'
      : 'Выбери подкласс';
  });

  function handleApply() {
    if (
      !currentClassUrl.value ||
      !currentLevel.value ||
      !selectedClassUrl.value ||
      !selectedLevel.value
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

    additionalClasses.value.forEach(
      (additionalClass: AdditionalClass, index: number) => {
        if (additionalClass.classUrl) {
          const classNumber = index + FIRST_ADDITIONAL_CLASS_NUMBER;

          query[`class${classNumber}`] = additionalClass.classUrl;
          query[`level${classNumber}`] = String(additionalClass.level);

          if (additionalClass.subclassUrl) {
            query[`subclass${classNumber}`] = additionalClass.subclassUrl;
          }
        }
      },
    );

    const queryString = new URLSearchParams(query).toString();
    const multiclassUrl = `/multiclass?${queryString}`;

    emit('close');
    navigateTo(multiclassUrl);
  }

  const canApply = computed(() => {
    return Boolean(selectedClassUrl.value && selectedLevel.value);
  });
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
            :placeholder="currentSubclassPlaceholder"
            :disabled="isCurrentSubclassDisabled(currentClassSubclasses)"
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
            placeholder="Выбери подкласс"
            :disabled="isSelectedSubclassDisabled(availableSubclasses)"
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
            Класс {{ index + FIRST_ADDITIONAL_CLASS_NUMBER }}:
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
            placeholder="Выбери подкласс"
            :disabled="
              getAdditionalSubclassDisabled(
                additionalClass.id,
                additionalClass.level,
              )
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
          :disabled="!canAddClass"
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
            :disabled="!canApply"
            @click.left.exact.prevent="handleApply()"
          >
            Создать
          </UButton>
        </div>
      </div>
    </div>
  </UiDrawer>
</template>
