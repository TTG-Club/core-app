<script setup lang="ts">
  import { Role, type SearchBody } from '~/shared/types';
  import { CreatureLegend } from '~bestiary/legend';
  import { CreatureLink } from '~bestiary/link';
  import { useFilter } from '~filter/composable';
  import { FilterControls } from '~filter/controls';
  import { PageGrid } from '~ui/page';
  import { SmallLinkSkeleton } from '~ui/skeleton';

  import type { CreatureLinkResponse } from '~bestiary/types';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: 'Бестиарий [Bestiary]',
    description: 'Бестиарий по D&D 2024 редакции',
  });

  const search = ref<string>('');

  const {
    filter,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
  } = await useFilter('bestiary-filters', '/api/v2/bestiary/filters');

  const searchBody = computed(() => {
    const body: SearchBody = {};

    if (filter) {
      body.filter = filter.value;
    }

    return Object.keys(body).length ? body : undefined;
  });

  const {
    data: bestiary,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'bestiary',
    () =>
      $fetch<Array<CreatureLinkResponse>>('/api/v2/bestiary/search', {
        method: 'POST',
        params: {
          query: search.value || undefined,
        },
        body: searchBody.value,
      }),
    { deep: false, watch: [search, filter] },
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Бестиарий"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <CreatureLegend />
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
          v-else-if="status === 'success' && bestiary?.length"
          :columns="3"
        >
          <CreatureLink
            v-for="creature in bestiary"
            :key="creature.url"
            :bestiary="creature"
          />
        </PageGrid>

        <AResult
          v-else-if="status === 'success' && !bestiary?.length"
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
  </NuxtLayout>
</template>
