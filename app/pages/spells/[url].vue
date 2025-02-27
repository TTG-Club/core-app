<script setup lang="ts">
  import { PageActions, PageContainer, PageHeader } from '~/shared/ui';
  import { SpellBody } from '~/features/wiki';
  import type { SpellDetail } from '~/shared/types';

  const spell = ref<SpellDetail>({
    url: 'poison-spray',
    name: {
      rus: 'Брызги яда',
      eng: 'Poison Spray',
    },
    level: 0,
    school: 'Воплощение',
    source: {
      group: {
        name: 'Контент от третьих лиц',
        label: '3rd',
      },
      name: {
        rus: 'Руководство игрока в Мрачной лощине',
        eng: 'Grim Hollow’s The Players Guide',
        short: 'GHtPG',
      },
    },
    castingTime: '1 действие или 2 действия',
    ritual: true,
    concentration: true,
    range: '300 футов или нет',
    duration: '1 минута или 70 лет',
    components: {
      v: true,
      s: true,
      m: 'веточка дерева, в которое ударила молния',
    },
    description:
      'Вы выпускаете ядовитое облако в существо в пределах дистанции. Совершите дальнобойную атаку заклинанием против цели. При попадании цель получает 1к12 урона ядом.',
    upper:
      'Урон увеличивается на 1к12, когда вы достигаете 5 уровня (2к12), 11 уровня (3к12) и 17 уровня (4к12).',
    affiliation: {
      classes: [
        {
          url: 'barbarian',
          name: 'Жрец',
        },
        {
          url: 'barbarian',
          name: 'Жрец',
        },
      ],
      subclasses: [
        {
          url: 'kitchen-domain',
          name: 'Домен Кухни',
        },
        {
          url: 'kitchen-domain',
          name: 'Домен Кухни',
        },
      ],
      species: [
        {
          url: 'beerfolk',
          name: 'Пивозавр',
        },
        {
          url: 'beerfolk',
          name: 'Пивозавр',
        },
      ],
      lineages: [
        {
          url: 'roting-meat',
          name: 'Грязебрюх',
        },
        {
          url: 'roting-meat',
          name: 'Грязебрюх',
        },
      ],
    },
    updatedAt: '2025-02-26T00:00:00.000Z',
  });

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
      :title="spell.name.rus"
      :subtitle="spell.name.eng"
      :source="spell.source"
      :date-time="spell.updatedAt"
    >
      <template #actions>
        <PageActions @close="navigateTo({ name: 'spells' })" />
      </template>
    </PageHeader>

    <SpellBody :spell="spell" />
  </PageContainer>
</template>
