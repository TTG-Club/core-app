<script setup lang="ts">
  import { MulticlassBody } from '~classes/multiclass';
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';

  import type { MulticlassData } from '~classes/multiclass';
  import type { ClassDetailResponse } from '~classes/types';
  import type { Level } from '~/shared/types';

  const route = useRoute();

  // Получение параметров из query для всех классов (до 10)
  const classData: Array<{
    url?: string;
    level?: Level;
    subclass?: string;
  }> = [];

  for (let i = 1; i <= 10; i++) {
    const classUrl = route.query[`class${i}`] as string | undefined;
    const levelRaw = Number(route.query[`level${i}`]);
    const level = (
      levelRaw >= 1 && levelRaw <= 20 ? levelRaw : undefined
    ) as Level | undefined;
    const subclass = route.query[`subclass${i}`] as string | undefined;

    if (classUrl && level) {
      classData.push({ url: classUrl, level, subclass });
    }
  }

  // Загрузка данных классов
  const classDetails = await Promise.all(
    classData.map((c, index) =>
      useAsyncData(
        computed(() => `class-${index}-${c.subclass || c.url || ''}`),
        () => {
          const url = c.subclass || c.url;
          if (!url) {
            return Promise.resolve(null);
          }
          return $fetch<ClassDetailResponse>(`/api/v2/classes/${url}`);
        },
        {
          watch: [() => c.subclass, () => c.url],
        },
      ),
    ),
  );

  const error = computed(() => {
    const firstError = classDetails.find((cd) => cd.error.value);
    return firstError?.error.value || undefined;
  });

  const multiclassData = computed<MulticlassData | null>(() => {
    const validClasses = classDetails
      .map((cd, index) => {
        const detail = cd.data.value;
        const originalData = classData[index];
        if (detail && originalData && originalData.level) {
          return {
            url: originalData.url!,
            subclassUrl: originalData.subclass,
            level: originalData.level,
            detail: detail,
          };
        }
        return null;
      })
      .filter(Boolean) as MulticlassData['classes'];

    if (validClasses.length < 2) {
      return null;
    }

    return {
      classes: validClasses,
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
        :error="error"
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
