<script setup lang="ts">
  import { getSlicedString } from '~/shared/utils';
  import { MagicItemBody } from '~magic-items/body';
  import { PageActions } from '~ui/page';

  import type { MagicItemDetailResponse } from '~magic-items/types';

  const route = useRoute();

  const { data: magicItem } = await useAsyncData(
    `magicItem-${route.params.url}`,
    () =>
      $fetch<MagicItemDetailResponse>(`/api/v2/magic-item/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () =>
      magicItem.value ? magicItem.value.source.name.rus : undefined,
    titleTemplate: '%s | Магические предметы D&D 5 2024',
  });

  function getSeoTitle() {
    if (!magicItem.value) {
      return '';
    }

    return getSlicedString(magicItem.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!magicItem.value) {
      return '';
    }

    return getSlicedString(
      `${magicItem.value.name.rus} [${magicItem.value.name.eng}] — ${magicItem.value.subtitle} D&D 5 2024 редакции`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/magic-items/${route.params.url}`);
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="magicItem?.name.rus"
    :subtitle="magicItem?.name.eng"
    :source="magicItem?.source"
    :date-time="magicItem?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        @close="navigateTo({ name: 'magic-items' })"
      />
    </template>

    <template #default>
      <MagicItemBody
        v-if="magicItem"
        :magic-item
      />

      <ASkeleton
        v-else
        :title="false"
        :paragraph="{ rows: 4 }"
      />
    </template>
  </NuxtLayout>
</template>
