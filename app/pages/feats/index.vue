<script setup lang="ts">
  import { FeatLegend } from '~feats/legend';
  import { FeatLink } from '~feats/link';
  import { FilterControls } from '~filter/controls';
  import { PageContainer, PageGrid, PageHeader } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { FeatLinkResponse } from '~/shared/types';

  useSeoMeta({
    title: 'Черты [Feats]',
    description: 'Черты по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    data: feats,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'feats',
    () =>
      $fetch<Array<FeatLinkResponse>>('/api/v2/feats/search', {
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
      <PageHeader title="Черты" />
    </template>

    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend>
          <FeatLegend />
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
          v-else-if="status === 'success' && feats?.length"
          :columns="3"
        >
          <FeatLink
            v-for="feat in feats"
            :key="feat.url"
            :feat="feat"
          />
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !feats?.length"
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
