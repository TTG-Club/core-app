<script setup lang="ts">
  import { FilterControls } from '~filter/controls';
  import { MagicItemLegend } from '~magic-items/legend';
  import { MagicItemLink } from '~magic-items/link';
  import { PageContainer, PageGrid, PageHeader } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { MagicItemLinkResponse } from '~magic-items/types';

  useSeoMeta({
    title: 'Магические предметы [Magic Items]',
    description: 'Магические предметы по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: magicItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'magicItems',
    () =>
      $fetch<Array<MagicItemLinkResponse>>('/api/v2/magic-item/search', {
        method: 'POST',
        params: {
          query:
            search.value && search.value.length >= 3 ? search.value : undefined,
        },
      }),
    {
      deep: false,
      watch: [search],
    },
  );
</script>

<template>
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Магические предметы" />
    </template>

    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <MagicItemLegend />
        </template>
      </FilterControls>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid
          v-if="status !== 'success' && status !== 'error'"
          :columns="3"
        >
          <SmallLinkSkeleton
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <PageGrid
          v-else-if="status === 'success' && magicItems?.length"
          :columns="3"
        >
          <MagicItemLink
            v-for="magicItem in magicItems"
            :key="magicItem.url"
            :magic-item="magicItem"
          />
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !magicItems?.length"
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
    </template>
  </PageContainer>
</template>
