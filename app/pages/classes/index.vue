<script setup lang="ts">
  import type { ClassDetailResponse, ClassLinkResponse } from '~classes/model';

  import {
    SECTION_COMPACT_LIST_SIZE,
    SECTION_COMPACT_SPLIT_ID,
  } from '~/shared/consts';
  import { ClassBody } from '~classes/body';
  import { ClassLink } from '~classes/link';
  import {
    CLASS_LIST_GROUP_FIELD,
    CLASS_LIST_GROUP_SORT,
    getClassGroupLabel,
    getClassMarkdown,
    sortClassesByGroup,
  } from '~classes/model';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { useListView } from '~infrastructure/list-presentation/composable';
  import { UiDetailPane, UiDetailPaneEmpty } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  const route = useRoute();

  useSeoMeta({
    title: 'Классы [Classes] — D&D 5 (2024)',
    description: 'Классы персонажей из D&D 5 (редакция 2024 года).',
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    defaults: filterDefaults,
  } = await useFilter('classes', '/api/v2/classes/filters');

  const {
    data: classes,
    status,
    error,
    refresh,
  } = await useAsyncData(
    'classes',
    () =>
      $fetch<Array<ClassLinkResponse>>('/api/v2/classes/search', {
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

  // Классы в порядке экрана — по группам: по нему панель листает соседние
  const orderedClasses = computed(() =>
    classes.value ? sortClassesByGroup(classes.value) : undefined,
  );

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
    }),
  );

  const {
    detailUrl,
    detailData: detailClass,
    isDetailLoading,
    isDetailError,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  } = useSectionDetail<ClassDetailResponse>({
    sectionPath: '/classes',
    apiBasePath: '/api/v2/classes',
    items: orderedClasses,
    getParentUrl: (detail) => detail.parent?.url,
  });

  const markdown = useEntityMarkdown(detailClass, getClassMarkdown);

  /** Возврат от подкласса к его классу в той же сплит-панели. */
  const backTo = computed(() => {
    const parentUrl = detailClass.value?.parent?.url;

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
    title="Классы"
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
          v-else-if="status === 'success' && orderedClasses?.length"
          :columns="listColumns"
          :items="orderedClasses"
          :reset-key="listResetKey"
          :field="CLASS_LIST_GROUP_FIELD"
          :separator-label="getClassGroupLabel"
          :group-sort="CLASS_LIST_GROUP_SORT"
          :active-item-key="detailUrl"
        >
          <template #default="{ item: characterClass }">
            <ClassLink :character-class />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="classes"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailClass?.name ?? ''"
        :source="detailClass?.source"
        :date-time="detailClass?.updatedAt"
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
        <ClassBody
          v-if="detailClass"
          :detail="detailClass"
          in-split
        />
      </UiDetailPane>

      <UiDetailPaneEmpty
        v-else
        title="Класс не выбран"
        description="Выберите класс из списка, чтобы просмотреть подробную информацию"
      />
    </template>
  </NuxtLayout>
</template>
