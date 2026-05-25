<script setup lang="ts">
  import type { FetchStatusValue } from '~/shared/consts';
  import type {
    GlossaryDetailResponse,
    GlossaryLinkResponse,
  } from '~glossary/model';

  import { FetchStatus } from '~/shared/consts';
  import { GlossaryBody } from '~glossary/body';
  import { GlossaryLink } from '~glossary/link';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Глоссарий [Glossary]',
    description: 'Глоссарий из D&D 5 (редакция 2024 года).',
  });

  const { isSplitActive } = useLayoutWidth();

  const route = useRoute();
  const router = useRouter();

  const {
    filter,
    search,
    filterQuery,
    isPending: isFilterPending,
    isShowedPreview: isFilterPreviewShowed,
    defaults: filterDefaults,
  } = await useFilter('glossary', '/api/v2/glossary/filters');

  const {
    data: glossaryItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'glossary',
    () =>
      $fetch<Array<GlossaryLinkResponse>>('/api/v2/glossary/search', {
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

  const glossaryCache = createLruCache<string, GlossaryDetailResponse>(50);

  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const detailGlossary = ref<GlossaryDetailResponse | null>(null);
  const detailStatus = ref<FetchStatusValue>(FetchStatus.Idle);

  /**
   * Загрузка детальных данных записи глоссария по URL.
   * @param url Идентификатор записи глоссария.
   */
  async function fetchGlossaryDetail(url: string): Promise<void> {
    if (!url) {
      detailGlossary.value = null;
      detailStatus.value = FetchStatus.Idle;

      return;
    }

    if (glossaryCache.has(url)) {
      detailGlossary.value = glossaryCache.get(url) || null;
      detailStatus.value = FetchStatus.Success;

      return;
    }

    detailStatus.value = FetchStatus.Pending;

    try {
      const response = await $fetch<GlossaryDetailResponse>(
        `/api/v2/glossary/${url}`,
      );

      glossaryCache.set(url, response);
      detailGlossary.value = response;
      detailStatus.value = FetchStatus.Success;
    } catch {
      detailGlossary.value = null;
      detailStatus.value = FetchStatus.Error;
    }
  }

  const isDetailDismissed = ref(false);
  const isRouterReady = ref(false);

  watch(
    detailUrl,
    (url) => {
      if (url) {
        isDetailDismissed.value = false;
      }

      fetchGlossaryDetail(url);
    },
    { immediate: true },
  );

  const isDetailLoading = computed(
    () => detailStatus.value === FetchStatus.Pending,
  );

  const isDetailError = computed(
    () => detailStatus.value === FetchStatus.Error,
  );

  const detailUrlForCopy = computed(() =>
    detailUrl.value ? `${getOrigin()}/glossary/${detailUrl.value}` : undefined,
  );

  const detailEditUrl = computed(() =>
    detailUrl.value ? `/workshop/glossary/${detailUrl.value}` : undefined,
  );

  watch([isSplitActive, detailUrl], ([splitActive, urlVal]) => {
    if (isRouterReady.value && !splitActive && urlVal) {
      navigateTo({
        name: 'glossary-url',
        params: { url: urlVal },
      });

      router.replace({
        query: {
          ...route.query,
          detail: undefined,
        },
      });
    }
  });

  /**
   * Автоматический выбор первой записи глоссария в списке.
   */
  function autoSelectFirstGlossaryItem() {
    if (!isSplitActive.value || isDetailDismissed.value) {
      return;
    }

    const firstGlossaryItem = glossaryItems.value?.[0];

    if (firstGlossaryItem && !route.query.detail) {
      router.replace({
        query: {
          ...route.query,
          detail: firstGlossaryItem.url,
        },
      });
    }
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailUrl.value) {
      navigateTo({
        name: 'glossary-url',
        params: { url: detailUrl.value },
      });

      router.replace({
        query: {
          ...route.query,
          detail: undefined,
        },
      });

      return;
    }

    autoSelectFirstGlossaryItem();
  });

  watch([glossaryItems, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirstGlossaryItem();
    }
  });

  /**
   * Закрытие детальной панели.
   */
  function handleCloseDetail() {
    isDetailDismissed.value = true;

    router.push({
      query: {
        ...route.query,
        detail: undefined,
      },
    });
  }

  useHead(() => {
    if (isSplitActive.value && detailUrl.value) {
      return {
        link: [
          {
            rel: 'canonical',
            href: `${getOrigin()}/glossary/${detailUrl.value}`,
          },
        ],
      };
    }

    return {};
  });

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
    }),
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Глоссарий"
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
          v-else-if="status === 'success' && glossaryItems?.length"
          :items="glossaryItems"
          :reset-key="listResetKey"
          field="tagCategory"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <GlossaryLink :glossary="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="glossaryItems"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailGlossary?.name ?? ''"
        :source="detailGlossary?.source"
        :date-time="detailGlossary?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <GlossaryBody
          v-if="detailGlossary"
          :glossary="detailGlossary"
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
            Запись не выбрана
          </h3>

          <p class="text-sm text-secondary">
            Выберите запись из списка слева, чтобы просмотреть подробную
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
