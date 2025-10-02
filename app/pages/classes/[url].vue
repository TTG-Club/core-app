<script setup lang="ts">
  import { ClassBody } from '~classes/body';
  import { PageActions } from '~ui/page';
  import { UiResult } from '~ui/result';

  import type { ClassDetailResponse } from '~classes/types';

  const {
    params: { url },
  } = useRoute();

  const {
    data: detail,
    error,
    refresh,
  } = await useAsyncData(`classes-${url}`, () =>
    $fetch<ClassDetailResponse>(`/api/v2/classes/${url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    ogImage: () => (detail.value ? detail.value.image : undefined),
    author: () => (detail.value ? detail.value.source.name.rus : undefined),
    titleTemplate: '%s | Классы D&D 5 2024',
  });

  function getSeoTitle() {
    if (!detail.value) {
      return '';
    }

    return getSlicedString(detail.value.name.rus, 26);
  }

  function getSeoDescription() {
    if (!detail.value) {
      return '';
    }

    return getSlicedString(
      `${detail.value.name.rus} [${detail.value.name.eng}] — класс D&D 5 2024 редакции. `,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/classes/${url}`);
</script>

<template>
  <NuxtLayout
    id="classes-base"
    name="detail"
    :title="detail?.name.rus"
    :subtitle="detail?.name.eng"
    :source="detail?.source"
    :date-time="detail?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        @close="navigateTo('/classes')"
      />
    </template>

    <template #default>
      <div v-if="detail">
        <ClassBody :detail="detail" />
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
