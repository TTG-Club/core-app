<script setup lang="ts">
  import type {
    SpeciesDetailResponse,
    SpeciesLinkResponse,
  } from '~species/model';

  import {
    SECTION_COMPACT_LIST_SIZE,
    SECTION_COMPACT_SPLIT_ID,
  } from '~/shared/consts';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { useListView } from '~infrastructure/list-presentation/composable';
  import { SpeciesBody } from '~species/body';
  import { SpeciesLink } from '~species/link';
  import {
    getSpeciesGroupLabel,
    getSpeciesMarkdown,
    sortSpeciesByGroup,
    SPECIES_LIST_GROUP_FIELD,
    SPECIES_LIST_GROUP_SORT,
  } from '~species/model';
  import { UiDetailPane, UiDetailPaneEmpty } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  const route = useRoute();

  useSeoMeta({
    title: 'Виды [Species] — D&D 5 (2024)',
    description:
      'Виды и происхождения персонажей из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
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

  // Виды в порядке экрана — по группам: по нему панель листает соседние
  const orderedSpecies = computed(() =>
    data.value ? sortSpeciesByGroup(data.value) : undefined,
  );

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
    }),
  );

  const {
    detailUrl,
    detailData: detailSpecies,
    isDetailLoading,
    isDetailError,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  } = useSectionDetail<SpeciesDetailResponse>({
    sectionPath: '/species',
    apiBasePath: '/api/v2/species',
    items: orderedSpecies,
    getParentUrl: (detail) => detail.parent?.url ?? detail.species?.url,
  });

  const markdown = useEntityMarkdown(detailSpecies, getSpeciesMarkdown);

  /** Возврат к родительскому виду в той же сплит-панели. */
  const backTo = computed(() => {
    const parentUrl =
      detailSpecies.value?.parent?.url ?? detailSpecies.value?.species?.url;

    return parentUrl
      ? { query: { ...route.query, detail: parentUrl } }
      : undefined;
  });

  const { columns: listColumns } = useListView();
</script>

<template>
  <NuxtLayout
    name="section"
    collapsible-controls
    :list-default-size="SECTION_COMPACT_LIST_SIZE.default"
    :list-min-size="SECTION_COMPACT_LIST_SIZE.min"
    :list-max-size="SECTION_COMPACT_LIST_SIZE.max"
    :split-id="SECTION_COMPACT_SPLIT_ID"
    title="Виды"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
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

        <GroupedList
          v-else-if="status === 'success' && orderedSpecies?.length"
          :columns="listColumns"
          :items="orderedSpecies"
          :reset-key="listResetKey"
          :field="SPECIES_LIST_GROUP_FIELD"
          :separator-label="getSpeciesGroupLabel"
          :group-sort="SPECIES_LIST_GROUP_SORT"
          :active-item-key="detailUrl"
        >
          <template #default="{ item: species }">
            <SpeciesLink :species />
          </template>
        </GroupedList>

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
        :markdown
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        :back-to="backTo"
        copy-title
        :neighbours="detailNeighbours"
        @close="handleCloseDetail"
        @navigate="openDetail"
      >
        <SpeciesBody
          v-if="detailSpecies"
          :species="detailSpecies"
        />
      </UiDetailPane>

      <UiDetailPaneEmpty
        v-else
        title="Вид не выбран"
        description="Выберите вид из списка, чтобы просмотреть подробную информацию"
      />
    </template>
  </NuxtLayout>
</template>
