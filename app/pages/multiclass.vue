<script setup lang="ts">
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';
  import { MulticlassBody } from '~classes/body';
  import type { MulticlassDetailResponse } from '~classes/types';

  const route = useRoute();

  // Типы для запроса к API мультикласса
  // Примечание: API использует `class` (единственное) для основного класса
  // и `classes` (множественное) для массива дополнительных классов
  type AdditionalClassItem = {
    url: string; // URL класса
    level: number; // Уровень класса
    subclass?: string; // URL подкласса (опционально)
  };

  interface MainClassData {
    url: string;
    level: number;
    subclass?: string;
  }

  interface MulticlassRequest {
    class: string; // URL основного класса
    level: number; // Уровень основного класса
    subclass?: string; // URL подкласса основного класса (опционально)
    classes: AdditionalClassItem[]; // Массив дополнительных классов
  }

  // Парсинг основного класса из query параметров
  const mainClass = computed<MainClassData | null>(() => {
    const url =
      typeof route.query.class1 === 'string' ? route.query.class1 : undefined;
    const levelRaw = Number(route.query.level1);
    const level =
      levelRaw >= 1 && levelRaw <= 20 ? levelRaw : undefined;
    const subclass =
      typeof route.query.subclass1 === 'string'
        ? route.query.subclass1
        : undefined;

    if (!url || !level) {
      return null;
    }

    const result: MainClassData = {
      url,
      level,
    };

    if (subclass && subclass.trim() !== '') {
      result.subclass = subclass;
    }

    return result;
  });

  // Парсинг дополнительных классов из query параметров
  const additionalClasses = computed<AdditionalClassItem[]>(() => {
    const classes: AdditionalClassItem[] = [];

    // Обрабатываем дополнительные классы (начиная со второго, так как первый - основной)
    const classKeys = Object.keys(route.query).filter((key) =>
      key.startsWith('class'),
    );

    for (const classKey of classKeys) {
      const index = classKey.replace('class', '');

      if (index === '1') {
        continue; // Пропускаем основной класс
      }

      const classUrl =
        typeof route.query[classKey] === 'string'
          ? route.query[classKey]
          : undefined;

      const levelQueryKey = `level${index}`;
      const levelRaw = Number(route.query[levelQueryKey]);
      const level = levelRaw >= 1 && levelRaw <= 20 ? levelRaw : undefined;

      const subclassQueryKey = `subclass${index}`;
      const subclass =
        typeof route.query[subclassQueryKey] === 'string'
          ? route.query[subclassQueryKey]
          : undefined;

      if (classUrl && level) {
        const classData: AdditionalClassItem = {
          url: classUrl,
          level,
        };

        if (subclass) {
          classData.subclass = subclass;
        }

        classes.push(classData);
      }
    }

    return classes;
  });

  // Формируем body для POST запроса из query параметров
  const requestBody = computed<MulticlassRequest | null>(() => {
    const main = mainClass.value;
    const additional = additionalClasses.value;

    if (!main || additional.length === 0) {
      return null;
    }

    const body: MulticlassRequest = {
      class: main.url,
      level: main.level,
      classes: additional,
    };

    if (main.subclass) {
      body.subclass = main.subclass;
    }

    return body;
  });

  // Генерируем простой и понятный ключ для кеширования на основе query параметров
  const multiclassKey = computed(() => {
    // Используем отсортированные query параметры для создания уникального и читаемого ключа
    const sortedKeys = Object.keys(route.query).sort();
    const parts: string[] = [];

    for (const key of sortedKeys) {
      const value = route.query[key];
      if (value && typeof value === 'string') {
        parts.push(`${key}=${value}`);
      }
    }

    return parts.length > 0 ? `multiclass-${parts.join('&')}` : 'multiclass-empty';
  });

  // Функция для получения данных мультикласса
  function fetchMulticlassData(
    body: MulticlassRequest | null,
  ): Promise<unknown> {
    if (!body) {
      return Promise.resolve(null);
    }

    return $fetch('/api/v2/multiclass', {
      method: 'POST',
      body,
    });
  }

  const {
    data: classDetail,
    error,
    refresh,
  } = await useAsyncData(
    multiclassKey,
    () => {
      if (!requestBody.value) {
        return Promise.resolve(null);
      }

      return fetchMulticlassData(requestBody.value);
    },
  );

  useSeoMeta({
    title: 'Мультиклассирование',
    description:
      'Мультиклассирование — комбинация классов в D&D 5 (редакция 2024 года).',
    titleTemplate: '%s | Мультиклассы D&D 5 2024',
  });
</script>

<template>
  <NuxtLayout
    id="multiclass-base"
    name="detail"
    title="Мультиклассирование"
    subtitle="Multiclassing"
    copy-text
  >
    <template #actions>
      <PageActions @close="navigateTo('/classes')" />
    </template>

    <template #default>
      <MulticlassBody
        v-if="classDetail"
        :detail="classDetail as MulticlassDetailResponse"
      />

      <UiResult
        v-else
        :error
        status="error"
        title="Ошибка"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="refresh()"> Обновить</UButton>

          <UButton
            variant="ghost"
            @click.left.exact.prevent="navigateTo('/classes')"
          >
            Вернуться в список
          </UButton>
        </template>
      </UiResult>
    </template>
  </NuxtLayout>
</template>
