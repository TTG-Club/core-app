<script setup lang="ts">
  import { SpellLink } from '~/features/wiki';
  import { PageContainer, PageGrid, PageHeader } from '~/features/page';

  const spells = ref([
    {
      url: 'poison-spray',
      name: {
        rus: 'Брызги яда',
        eng: 'Poison Spray',
      },
      level: 0,
      school: 'Воплощение',
      group: {
        name: 'Контент от третьих лиц',
        label: '3rd',
      },
      concentration: true,
      ritual: true,
      components: {
        v: true,
        s: true,
        m: true,
      },
    },
  ]);
</script>

<template>
  <PageContainer>
    <PageHeader title="Виды">
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

    <PageGrid :columns="{ xl: 3, md: 2, xs: 1 }">
      <SpellLink
        v-for="spell in spells"
        :key="spell.url"
        :spell="spell"
      />
    </PageGrid>
  </PageContainer>
</template>
