<script setup lang="ts">
  import { getSlicedString } from '~/shared/utils';
  import { GlossaryBody } from '~glossary/body';
  import { PageActions } from '~ui/page';

  import type { GlossaryDetailResponse } from '~/shared/types';

  const route = useRoute();

  const { data: glossary } = await useAsyncData(
    `glossary-${route.params.url}`,
    () =>
      $fetch<GlossaryDetailResponse>(`/api/v2/glossary/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (glossary.value ? glossary.value.source.name.rus : undefined),
    titleTemplate: '%s | Глоссарий D&D 5 2024',
  });

  function getSeoTitle() {
    if (!glossary.value) {
      return '';
    }

    return getSlicedString(glossary.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!glossary.value) {
      return '';
    }

    return getSlicedString(
      `${glossary.value.name.rus} [${glossary.value.name.eng}] — ${glossary.value.tagCategory} D&D 5 2024 редакции`,
      160,
    );
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="glossary?.name.rus"
    :subtitle="glossary?.name.eng"
    :source="glossary?.source"
    :date-time="glossary?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions @close="navigateTo({ name: 'glossary' })" />
    </template>

    <template #default>
      <GlossaryBody
        v-if="glossary"
        :glossary
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
