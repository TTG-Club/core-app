<script setup lang="ts">
  import { SpellLink } from '~/features/wiki';
  import {
    PageContainer,
    PageGrid,
    PageHeader,
    SmallLinkSkeleton,
  } from '~/shared/ui';
  import type { SpellLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Заклинания (Spells)',
    description: 'Заклинания по D&D 2024 редакции',
  });

  const { data: spells } = await useAsyncData('spells', () =>
    $fetch<Array<SpellLinkResponse>>('/api/v2/spells/search', {
      method: 'POST',
    }),
  );

  const columns = { xl: 3, md: 2, xs: 1 };
  const count = 5;

  const skeletonItems = ref(Array.from({ length: count }, faker.string.uuid));
</script>

<template>
  <PageContainer>
    <PageHeader title="Заклинания">
      <template #filter>
        <AButton
          type="primary"
          :style="{ boxShadow: 'none' }"
        >
          Фильтры
        </AButton>

        <AInput
          placeholder="Введите текст..."
          allow-clear
        />
      </template>
    </PageHeader>

    <PageGrid :columns>
      <SpellLink
        v-for="spell in spells"
        :key="spell.url"
        :spell="spell"
      />

      <template v-if="!spells?.length">
        <SmallLinkSkeleton
          v-for="uuid in skeletonItems"
          :key="uuid"
        />
      </template>
    </PageGrid>
  </PageContainer>
</template>
