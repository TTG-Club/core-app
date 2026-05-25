<script setup lang="ts">
  import type {
    SpeciesDetailResponse,
    SpeciesLinkResponse,
  } from '~species/model';

  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { SpeciesBody } from '~species/body';
  import { SpeciesLink } from '~species/link';
  import { UiDetailPane } from '~ui/detail-pane';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  useSeoMeta({
    title: 'Виды [Species]',
    description:
      'Виды и происхождения персонажей из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    defaults: filterDefaults,
  } = await useFilter('species', '/api/v2/species/filters');

  const { data, status, error, refresh } = await useAsyncData(
    'species',
    () =>
      $fetch<Array<SpeciesLinkResponse>>('/api/v2/species/search', {
        method: 'GET',
        query: {
          search: search.value,
          ...filterQuery.value,
        },
      }),
    {
      deep: false,
      watch: [search, filterQuery],
    },
  );

  const {
    detailUrl,
    detailData: detailSpecies,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
  } = useSectionDetail<SpeciesDetailResponse>({
    sectionPath: '/species',
    apiBasePath: '/api/v2/species',
    items: data,
  });
</script>

<template>
  <NuxtLayout
    name="section"
    title="Виды"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
      </FilterControls>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid v-if="status !== 'success' && status !== 'error'">
          <SkeletonLinkBig
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <PageGrid v-else-if="status === 'success' && data?.length">
          <SpeciesLink
            v-for="link in data"
            :key="link.url"
            :species="link"
          />
        </PageGrid>

        <PageResult
          v-else
          :items="data"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailSpecies?.name ?? ''"
        :source="detailSpecies?.source"
        :date-time="detailSpecies?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <SpeciesBody
          v-if="detailSpecies"
          :species="detailSpecies"
          hide-gallery
        />
      </UiDetailPane>

      <div
        v-else-if="isDetailDismissed"
        class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
      >
        <div class="flex max-w-xs flex-col items-center gap-3">
          <UIcon
            name="tabler:click"
            class="size-10 text-muted"
          />

          <h3 class="text-lg font-semibold text-highlighted">Вид не выбран</h3>

          <p class="text-sm text-secondary">
            Выберите вид из списка слева, чтобы просмотреть подробную информацию
          </p>
        </div>
      </div>

      <UiDetailPane
        v-else
        title=""
        :is-loading="true"
      />
    </template>
  </NuxtLayout>
</template>
