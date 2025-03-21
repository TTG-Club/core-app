<script setup lang="ts">
  import { getSlicedString } from '~/shared/utils';
  import type { SpellDetailResponse } from '~/shared/types';
  import { SpellBody } from '~spells/body';
  import { PageActions, PageContainer, PageHeader } from '~ui/page';

  const route = useRoute();

  const { data: spell } = await useAsyncData(`spell-${route.params.url}`, () =>
    $fetch<SpellDetailResponse>(`/api/v2/spells/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (spell.value ? spell.value.source.name.rus : undefined),
    titleTemplate: '%s | Заклинания D&D 5 2024',
  });

  function getSeoTitle() {
    if (!spell.value) {
      return '';
    }

    return getSlicedString(spell.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!spell.value) {
      return '';
    }

    const level = spell.value.level
      ? `заклинание ${spell.value.level}-го уровня`
      : 'магический заговор';

    const school = `школы «${spell.value.school}»`;

    return getSlicedString(
      `${spell.value.name.rus} [${spell.value.name.eng}] — ${level} ${school} D&D 5 2024 редакции`,
      160,
    );
  }
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
