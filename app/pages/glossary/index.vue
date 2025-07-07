<script setup lang="ts">
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { GlossaryLegend } from '~glossary/legend';
  import { GlossaryLink } from '~glossary/link';
  import { PageContainer, PageGrid, PageHeader } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { SearchBody, GlossaryLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Глоссарий [Glossary]',
    description: 'Глоссарий по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('glossary-filters', '/api/v2/glossary/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: glossaryItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'glossary',
    () =>
      $fetch<Array<GlossaryLinkResponse>>('/api/v2/glossary/search', {
        method: 'POST',
        params: {
          query:
            search.value && search.value.length >= 3 ? search.value : undefined,
        },
        body: searchBody.value,
      }),
    {
      deep: false,
      watch: [search, filter],
    },
  );
</script>

<template>
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Глоссарий" />
    </template>

    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <GlossaryLegend />
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
          v-else-if="status === 'success' && glossaryItems?.length"
          :columns="3"
        >
          <GlossaryLink
            v-for="item in glossaryItems"
            :key="item.url"
            :glossary="item"
          />
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !glossaryItems?.length"
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
