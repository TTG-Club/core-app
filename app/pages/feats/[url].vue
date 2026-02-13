<script setup lang="ts">
  import { FeatBody } from '~feats/body';
  import { PageActions } from '~ui/page';

  import type { FeatDetailResponse } from '~feats/model';

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
      `${feat.value.name.rus} [${feat.value.name.eng}] — ${feat.value.category} из D&D 5 (редакция 2024 года).`,
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
        :close-url="{ name: 'feats' }"
      />
    </template>

    <template #default>
      <FeatBody
        v-if="feat"
        :feat
      />

      <template v-else>
        <USkeleton
          v-for="index in 3"
          :key="index"
          :class="`w-1/${index + 1} h-6`"
        />
      </template>
    </template>
  </NuxtLayout>
</template>
