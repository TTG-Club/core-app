<script setup lang="ts">
  import { getSlicedString } from '~/shared/utils';
  import { FeatBody } from '~feats/body';
  import { PageActions } from '~ui/page';

  import type { FeatDetailResponse } from '~/shared/types';

  const route = useRoute();

  const { data: feat } = await useAsyncData(`feat-${route.params.url}`, () =>
    $fetch<FeatDetailResponse>(`/api/v2/feats/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (feat.value ? feat.value.source.name.rus : undefined),
    titleTemplate: '%s | Черты D&D 5 2024',
  });

  function getSeoTitle() {
    if (!feat.value) {
      return '';
    }

    return getSlicedString(feat.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!feat.value) {
      return '';
    }

    return getSlicedString(
      `${feat.value.name.rus} [${feat.value.name.eng}] — ${feat.value.category} D&D 5 2024 редакции`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/feats/${route.params.url}`);
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="feat?.name.rus"
    :subtitle="feat?.name.eng"
    :source="feat?.source"
    :date-time="feat?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        @close="navigateTo({ name: 'feats' })"
      />
    </template>

    <template #default>
      <FeatBody
        v-if="feat"
        :feat
      />

      <ASkeleton
        v-else
        :title="false"
        :paragraph="{ rows: 4 }"
      />
    </template>
  </NuxtLayout>
</template>
