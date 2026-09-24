<script setup lang="ts">
  import type {
    BastionFacilityDetailResponse,
    BastionFacilityLinkResponse,
  } from '~bastions/model';

  import { BastionFacilityBody } from '~bastions/body';
  import { BastionFacilityLink } from '~bastions/link';
  import {
    BASTION_API_PATH,
    BASTION_SECTION,
    BASTION_SEO,
    compareBastionGroups,
    getBastionFacilityMarkdown,
    getBastionGroupLabel,
  } from '~bastions/model';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: BASTION_SEO.title,
    description: BASTION_SEO.description,
  });

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    defaults: filterDefaults,
  } = await useFilter(BASTION_SECTION, `${BASTION_API_PATH}/filters`);

  const {
    data: facilities,
    error,
    status,
    refresh,
  } = await useAsyncData(
    BASTION_SECTION,
    () =>
      $fetch<Array<BastionFacilityLinkResponse>>(`${BASTION_API_PATH}/search`, {
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
    detailData: detailFacility,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
  } = useSectionDetail<BastionFacilityDetailResponse>({
    sectionPath: `/${BASTION_SECTION}`,
    apiBasePath: BASTION_API_PATH,
    items: facilities,
  });

  const markdown = useEntityMarkdown(
    detailFacility,
    getBastionFacilityMarkdown,
  );

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
    }),
  );

  const groupSort = {
    mode: 'comparator',
    compare: compareBastionGroups,
  } as const;
</script>

<template>
  <NuxtLayout
    name="section"
    title="Бастионы"
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
        <PageGrid
          v-if="status !== 'success' && status !== 'error'"
          :columns="3"
        >
          <SkeletonLinkSmall
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <GroupedList
          v-else-if="status === 'success' && facilities?.length"
          :items="facilities"
          :reset-key="listResetKey"
          field="level"
          :separator-label="getBastionGroupLabel"
          :group-sort
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <BastionFacilityLink :facility="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="facilities"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailFacility?.name ?? ''"
        :source="detailFacility?.source"
        :date-time="detailFacility?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :markdown
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <BastionFacilityBody
          v-if="detailFacility"
          :facility="detailFacility"
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

          <h3 class="text-lg font-semibold text-highlighted">
            Сооружение не выбрано
          </h3>

          <p class="text-sm text-secondary">
            Выберите сооружение из списка слева, чтобы просмотреть подробную
            информацию
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
