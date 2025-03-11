<script setup lang="ts">
  import { SpellBody } from '~/features/spells';
  import { getSlicedString } from '~/shared/utils';
  import type { SpellDetailResponse } from '~/shared/types';
  import { PageActions, PageContainer, PageHeader } from '~/shared/ui';

  const route = useRoute();

  const { data: spell } = await useAsyncData(`spell-${route.params.url}`, () =>
    $fetch<SpellDetailResponse>(`/api/v2/spells/${route.params.url}`),
  );

  const seoTitle = computed(() => {
    if (!spell.value) {
      return '';
    }

    return getSlicedString(spell.value.name.rus, 36);
  });

  const seoDescription = computed(() => {
    if (!spell.value) {
      return '';
    }

    const level = spell.value.level
      ? `заклинание ${spell.value.level}-го уровня`
      : 'магический заговор';

    const school = `школы «${spell.value.school}»`;

    return getSlicedString(
      `${spell.value.name.rus} (${spell.value.name.eng}) — ${level} ${school} D&D 5 2024 редакции`,
      200,
    );
  });

  useSeoMeta({
    title: () => seoTitle.value,
    description: () => seoDescription.value,
    author: () => (spell.value ? spell.value.source.name.rus : ''),
    titleTemplate: (title) => `${title} | Заклинания D&D 5 2024`,
  });
</script>

<template>
  <PageContainer>
    <template #header>
      <PageHeader
        :title="spell?.name.rus"
        :subtitle="spell?.name.eng"
        :source="spell?.source"
        :date-time="spell?.updatedAt"
        copy-title
      >
        <template #actions>
          <PageActions @close="navigateTo({ name: 'spells' })" />
        </template>
      </PageHeader>
    </template>

    <template #default>
      <SpellBody
        v-if="spell"
        :spell
      />

      <ASkeleton
        v-else
        :title="false"
        :paragraph="{ rows: 4 }"
      />
    </template>
  </PageContainer>
</template>
