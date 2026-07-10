<script setup lang="ts">
  import type { ClassDetailResponse, ClassLinkResponse } from '~classes/model';

  import { ClassBody } from '~classes/body';
  import { ClassLink } from '~classes/link';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { UiDetailPane } from '~ui/detail-pane';
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
    isShowedPreview: isFilterPreviewShowed,
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

  const {
    detailUrl,
    detailData: detailClass,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
  } = useSectionDetail<ClassDetailResponse>({
    sectionPath: '/classes',
    apiBasePath: '/api/v2/classes',
    items: classes,
    getParentUrl: (detail) => detail.parent?.url,
  });
</script>

<template>
  <NuxtLayout
    name="section"
    title="Классы"
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

        <PageGrid v-else-if="status === 'success' && classes?.length">
          <ClassLink
            v-for="link in classes"
            :key="link.url"
            :character-class="link"
          />
        </PageGrid>

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
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        :back-to="
          detailClass?.parent
            ? { query: { ...route.query, detail: detailClass.parent.url } }
            : undefined
        "
        copy-title
        @close="handleCloseDetail"
      >
        <ClassBody
          v-if="detailClass"
          :detail="detailClass"
          in-split
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
            Класс не выбран
          </h3>

          <p class="text-sm text-secondary">
            Выберите класс из списка слева, чтобы просмотреть подробную
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
