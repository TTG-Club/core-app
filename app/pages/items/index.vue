<script setup lang="ts">
  import { FilterControls } from '~filter/controls';
  import { ItemLink } from '~items/link';
  import { MagicItemLegend } from '~magic-items/legend';
  import { PageContainer, PageGrid, PageHeader } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { ItemLinkResponse } from '~items/types';

  useSeoMeta({
    title: 'Предметы [Items]',
    description: 'Предметы по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: items,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'items',
    () =>
      $fetch<Array<ItemLinkResponse>>('/api/v2/item/search', {
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
      <PageHeader title="Предметы" />
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
          v-else-if="status === 'success' && items?.length"
          :columns="3"
        >
          <ItemLink
            v-for="item in items"
            :key="item.url"
            :item="item"
          />
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !items?.length"
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
