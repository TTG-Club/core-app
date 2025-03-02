<script setup lang="ts">
  import { PageActions, PageContainer, PageHeader } from '~/shared/ui';
  import { SpellBody } from '~/features/wiki';
  import type { SpellDetail } from '~/shared/types';

  const route = useRoute();

  const { data: spell } = await useAsyncData(`spell-${route.params.url}`, () =>
    $fetch<SpellDetail>(`/api/v2/spells/${route.params.url}`),
  );

  useSeoMeta({
    title: () =>
      spell.value ? `${spell.value.name.rus} (${spell.value.name.eng})` : '',
    description: () =>
      spell.value
        ? `${spell.value.name.rus} (${spell.value.name.eng}) — заклинание по D&D 2024 редакции. ${spell.value.description || ''}`.trim()
        : '',
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
