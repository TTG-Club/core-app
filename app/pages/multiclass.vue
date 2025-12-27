<script setup lang="ts">
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';
  import { MulticlassBody } from '~multiclass/body';
  import type {
    AdditionalClassItem,
    MainClassData,
    MulticlassDetailResponse,
    MulticlassRequest,
  } from '~multiclass/types';
  import { MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL } from '~multiclass/consts';

  const route = useRoute();

  // Парсинг основного класса из query параметров
  const mainClass = computed<MainClassData | null>(() => {
    const url =
      typeof route.query.class1 === 'string' ? route.query.class1 : undefined;

    const levelRaw = Number(route.query.level1);

    const level =
      levelRaw >= MIN_CHARACTER_LEVEL && levelRaw <= MAX_CHARACTER_LEVEL
        ? levelRaw
        : undefined;

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

    const MAIN_CLASS_INDEX = '1';

    for (const classKey of classKeys) {
      const index = classKey.replace('class', '');

      if (index === MAIN_CLASS_INDEX) {
        continue; // Пропускаем основной класс
      }

      const classUrl =
        typeof route.query[classKey] === 'string'
          ? route.query[classKey]
          : undefined;

      const levelQueryKey = `level${index}`;
      const levelRaw = Number(route.query[levelQueryKey]);

      const level =
        levelRaw >= MIN_CHARACTER_LEVEL && levelRaw <= MAX_CHARACTER_LEVEL
          ? levelRaw
          : undefined;

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

    return parts.length > 0
      ? `multiclass-${parts.join('&')}`
      : 'multiclass-empty';
  });

  // Функция для получения данных мультикласса
  function fetchMulticlassData(
    body: MulticlassRequest | null,
  ): Promise<MulticlassDetailResponse | null> {
    if (!body) {
      return Promise.resolve(null);
    }

    return $fetch<MulticlassDetailResponse>('/api/v2/multiclass', {
      method: 'POST',
      body,
    });
  }

  const {
    data: classDetail,
    error,
    refresh,
  } = await useAsyncData<MulticlassDetailResponse | null>(multiclassKey, () => {
    if (!requestBody.value) {
      return Promise.resolve(null);
    }

    return fetchMulticlassData(requestBody.value);
  });

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
        :detail="classDetail"
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
