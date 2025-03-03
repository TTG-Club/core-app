<script setup lang="ts">
  import { SpellLink } from '~/features/spells';
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

  const {
    data: spells,
    error,
    status,
    refresh,
  } = await useAsyncData('spells', () =>
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
          :style="{ boxShadow: 'none' }"
          type="primary"
          disabled
        >
          Фильтры
        </AButton>

        <AInput
          placeholder="Введите текст..."
          allow-clear
          disabled
        />
      </template>
    </PageHeader>

    <Transition
      name="fade"
      mode="out-in"
    >
      <PageGrid
        v-if="status !== 'success' && status !== 'error'"
        :columns
      >
        <SmallLinkSkeleton
          v-for="uuid in skeletonItems"
          :key="uuid"
        />
      </PageGrid>

      <PageGrid
        v-else-if="status === 'success' && spells?.length"
        :columns
      >
        <SpellLink
          v-for="spell in spells"
          :key="spell.url"
          :spell="spell"
        />
      </PageGrid>

      <AResult
        v-else-if="status === 'success' && !spells?.length"
        title="Ничего не нашлось"
        sub-title="По вашему запросу ничего не нашлось. Попробуйте изменить фильтр или строку поиска"
      >
        <template #extra>
          <AButton
            type="primary"
            @click.left.exact.prevent="refresh()"
          >
            Обновить
          </AButton>

          <AButton @click.left.exact.prevent="navigateTo('/')">
            Вернуться на главную
          </AButton>
        </template>
      </AResult>

      <AResult
        v-else-if="status === 'error'"
        :sub-title="error"
        status="error"
        title="Ошибка"
      >
        <template #extra>
          <AButton
            type="primary"
            @click.left.exact.prevent="refresh()"
          >
            Обновить
          </AButton>

          <AButton @click.left.exact.prevent="navigateTo('/')">
            Вернуться на главную
          </AButton>
        </template>
      </AResult>
    </Transition>
  </PageContainer>
</template>
