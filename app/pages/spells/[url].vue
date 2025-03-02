<script setup lang="ts">
  import { SpellBody } from '~/features/wiki';
  import { getSlicedString } from '~/shared/utils';
  import type { SpellDetail } from '~/shared/types';
  import { PageActions, PageContainer, PageHeader } from '~/shared/ui';

  const route = useRoute();

  const { data: spell } = await useAsyncData(`spell-${route.params.url}`, () =>
    $fetch<SpellDetail>(`/api/v2/spells/${route.params.url}`),
  );

  const seoTitle = computed(() => {
    if (!spell.value) {
      return '';
    }

    return getSlicedString(
      `${spell.value.name.rus} (${spell.value.name.eng})`,
      60,
    );
  });

  const seoDescription = computed(() => {
    if (!spell.value) {
      return '';
    }

    return getSlicedString(
      `${spell.value.name.rus} (${spell.value.name.eng}) — заклинание по D&D 2024 редакции. ${spell.value.description || ''}`,
      200,
    );
  });

  useSeoMeta({
    title: () => seoTitle.value,
    description: () => seoDescription.value,
    author: () => (spell.value ? spell.value.source.name.rus : ''),
  });
</script>

<template>
  <PageContainer>
    <PageHeader
      :title="spell?.name.rus"
      :subtitle="spell?.name.eng"
      :source="spell?.source"
      :date-time="spell?.updatedAt"
    >
      <template #actions>
        <PageActions @close="navigateTo({ name: 'spells' })" />
      </template>
    </PageHeader>

    <SpellBody
      v-if="spell"
      :spell
    />

    <ASkeleton
      v-else
      :title="false"
      :paragraph="{ rows: 4 }"
    />
  </PageContainer>
</template>
