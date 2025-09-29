<script setup lang="ts">
  import { ItemBody } from '~items/body';
  import { PageActions } from '~ui/page';
  import type { ItemDetailResponse } from '~items/types';

  const route = useRoute();

  const { data: item } = await useAsyncData(`item-${route.params.url}`, () =>
    $fetch<ItemDetailResponse>(`/api/v2/item/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (item.value ? item.value.source.name.rus : undefined),
    titleTemplate: '%s | Предметы D&D 5 2024',
  });

  function getSeoTitle() {
    if (!item.value) {
      return '';
    }

    return getSlicedString(item.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!item.value) {
      return '';
    }

    return getSlicedString(
      `${item.value.name.rus} [${item.value.name.eng}] — ${item.value.subtitle} D&D 5 2024 редакции`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/items/${route.params.url}`);
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="item?.name.rus"
    :subtitle="item?.name.eng"
    :source="item?.source"
    :date-time="item?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        @close="navigateTo({ name: 'items' })"
      />
    </template>

    <template #default>
      <ItemBody
        v-if="item"
        :item
      />

      <USkeleton
        v-else
        :title="false"
        :paragraph="{ rows: 4 }"
      />
    </template>
  </NuxtLayout>
</template>
