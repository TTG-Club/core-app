<script setup lang="ts">
  import { MulticlassBody } from '~classes/multiclass';
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';

  import type { MulticlassData } from '~classes/multiclass';
  import type { ClassDetailResponse } from '~classes/types';
  import type { Level } from '~/shared/types';

  const route = useRoute();

  // Получение параметров из query
  const class1Url = route.query.class1 as string | undefined;
  const class1LevelRaw = Number(route.query.level1);

  const class1Level = (
    class1LevelRaw >= 1 && class1LevelRaw <= 20 ? class1LevelRaw : undefined
  ) as Level | undefined;

  const class1Subclass = route.query.subclass1 as string | undefined;

  const class2Url = route.query.class2 as string | undefined;
  const class2LevelRaw = Number(route.query.level2);

  const class2Level = (
    class2LevelRaw >= 1 && class2LevelRaw <= 20 ? class2LevelRaw : undefined
  ) as Level | undefined;

  const class2Subclass = route.query.subclass2 as string | undefined;

  // Загрузка данных классов
  // Если есть подкласс, загружаем его, иначе базовый класс
  const class1FinalUrl = computed(() => class1Subclass || class1Url);
  const class2FinalUrl = computed(() => class2Subclass || class2Url);

  const { data: class1Detail, error: class1Error } = await useAsyncData(
    computed(() => `class1-${class1FinalUrl.value || ''}`),
    () => {
      const url = class1FinalUrl.value;

      if (!url) {
        return Promise.resolve(null);
      }

      return $fetch<ClassDetailResponse>(`/api/v2/classes/${url}`);
    },
    {
      watch: [class1FinalUrl],
    },
  );

  const { data: class2Detail, error: class2Error } = await useAsyncData(
    computed(() => `class2-${class2FinalUrl.value || ''}`),
    () => {
      const url = class2FinalUrl.value;

      if (!url) {
        return Promise.resolve(null);
      }

      return $fetch<ClassDetailResponse>(`/api/v2/classes/${url}`);
    },
    {
      watch: [class2FinalUrl],
    },
  );

  const error = computed(() => class1Error.value || class2Error.value);

  const multiclassData = computed<MulticlassData | null>(() => {
    if (
      !class1Detail.value ||
      !class2Detail.value ||
      !class1Level ||
      !class2Level
    ) {
      return null;
    }

    return {
      class1: {
        url: class1Url!,
        subclassUrl: class1Subclass,
        level: class1Level,
        detail: class1Detail.value,
      },
      class2: {
        url: class2Url!,
        subclassUrl: class2Subclass,
        level: class2Level,
        detail: class2Detail.value,
      },
    };
  });

  const title = computed(() => 'Мультиклассирование');

  const subtitle = computed(() => 'Multiclassing');

  useSeoMeta({
    title: () => title.value,
    description: () =>
      `Мультиклассирование — комбинация классов в D&D 5 (редакция 2024 года).`,
    titleTemplate: '%s | Мультиклассы D&D 5 2024',
  });
</script>

<template>
  <NuxtLayout
    id="classes-base"
    name="detail"
    :title
    :subtitle
    copy-text
  >
    <template #actions>
      <PageActions @close="navigateTo('/classes')" />
    </template>

    <template #default>
      <div v-if="multiclassData">
        <MulticlassBody :data="multiclassData" />
      </div>

      <UiResult
        v-else
        :error
        status="error"
        title="Ошибка"
      >
        <template #extra>
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
