<script setup lang="ts">
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';
  import {
    StatsBlock,
    ClassProficiency,
    FeatureCollapse,
  } from '~classes/body/ui';

  const route = useRoute();

  // Формируем body для POST запроса из query параметров
  const requestBody = computed(() => {
    // Первый класс (основной)
    const class1Url = route.query.class1 as string | undefined;
    const level1Raw = Number(route.query.level1);
    const level1 = level1Raw >= 1 && level1Raw <= 20 ? level1Raw : undefined;
    const subclass1 = route.query.subclass1 as string | undefined;

    if (!class1Url || !level1) {
      return null;
    }

    // Дополнительные классы (2-10)
    const additionalClasses: Array<{
      url: string;
      level: number;
      subclass?: string;
    }> = [];

    for (let i = 2; i <= 10; i++) {
      const classUrl = route.query[`class${i}`] as string | undefined;
      const levelRaw = Number(route.query[`level${i}`]);
      const level = levelRaw >= 1 && levelRaw <= 20 ? levelRaw : undefined;
      const subclass = route.query[`subclass${i}`] as string | undefined;

      if (classUrl && level) {
        const classData: {
          url: string;
          level: number;
          subclass?: string;
        } = {
          url: classUrl,
          level,
        };

        if (subclass) {
          classData.subclass = subclass;
        }

        additionalClasses.push(classData);
      }
    }

    // Проверяем, что есть хотя бы один дополнительный класс
    if (additionalClasses.length === 0) {
      return null;
    }

    // Формируем body согласно формату API
    const body: {
      class: string;
      level: number;
      subclass?: string;
      classes: Array<{
        url: string;
        level: number;
        subclass?: string;
      }>;
    } = {
      class: class1Url,
      level: level1,
      classes: additionalClasses,
    };

    // Добавляем subclass только если он есть (не undefined и не пустая строка)
    if (subclass1 && subclass1.trim() !== '') {
      body.subclass = subclass1;
    }

    return body;
  });

  const {
    data: apiResponse,
    error,
    refresh,
  } = await useAsyncData(
    computed(() => `multiclass-${JSON.stringify(requestBody.value)}`),
    async () => {
      if (!requestBody.value) {
        return null;
      }

      const response = await $fetch('/api/v2/multiclass', {
        method: 'POST',
        body: requestBody.value,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
      });

      return response;
    },
    {
      watch: [requestBody],
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
    id="classes-base"
    name="detail"
    title="Мультиклассирование"
    subtitle="Multiclassing"
    copy-text
  >
    <template #actions>
      <PageActions @close="navigateTo('/classes')" />
    </template>

    <template #default>
      <div
        v-if="apiResponse"
        class="@container"
      >
        <div class="flex flex-col gap-6 @min-3xl:flex-row @min-3xl:gap-7">
          <div
            :class="[
              'flex w-full shrink-0 flex-col gap-4',
              '@min-xl:@max-3xl:flex-row @min-3xl:w-80',
            ]"
          >
            <StatsBlock
              :hit-dice="apiResponse.hitDice"
              :saving-throws="apiResponse.savingThrows"
              :proficiency="apiResponse.proficiency"
              :primary-characteristics="apiResponse.primaryCharacteristics"
            />
          </div>

          <div class="flex min-w-0 flex-auto flex-col gap-6">
            <ClassProficiency
              :proficiency="apiResponse.proficiency"
              :saving-throws="apiResponse.savingThrows"
            />

            <FeatureCollapse
              v-for="feature in apiResponse.features"
              :key="feature.key"
              :feature
            />
          </div>
        </div>
      </div>

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
