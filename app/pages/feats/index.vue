<script setup lang="ts">
  import type { FetchStatusValue } from '~/shared/consts';
  import type { FeatDetailResponse, FeatLinkResponse } from '~feats/model';

  import { FetchStatus } from '~/shared/consts';
  import { FeatBody } from '~feats/body';
  import { FeatLink } from '~feats/link';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Черты [Feats]',
    description: 'Черты из D&D 5 (редакция 2024 года).',
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
  } = await useFilter('feats', '/api/v2/feats/filters');

  const {
    data: feats,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'feats',
    () =>
      $fetch<Array<FeatLinkResponse>>('/api/v2/feats/search', {
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

  // Локальный LRU-кэш для детальной информации о чертах
  const featCache = createLruCache<string, FeatDetailResponse>(50);

  // Вычисляем выбранный URL черты из query-параметров
  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const detailFeat = ref<FeatDetailResponse | null>(null);
  const detailStatus = ref<FetchStatusValue>(FetchStatus.Idle);

  /**
   * Загрузка детальных данных черты по URL.
   * @param url Идентификатор черты.
   */
  async function fetchFeatDetail(url: string): Promise<void> {
    if (!url) {
      detailFeat.value = null;
      detailStatus.value = FetchStatus.Idle;

      return;
    }

    if (featCache.has(url)) {
      detailFeat.value = featCache.get(url) || null;
      detailStatus.value = FetchStatus.Success;

      return;
    }

    detailStatus.value = FetchStatus.Pending;

    try {
      const response = await $fetch<FeatDetailResponse>(`/api/v2/feats/${url}`);

      featCache.set(url, response);
      detailFeat.value = response;
      detailStatus.value = FetchStatus.Success;
    } catch {
      detailFeat.value = null;
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

      fetchFeatDetail(url);
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
    detailUrl.value ? `${getOrigin()}/feats/${detailUrl.value}` : undefined,
  );

  const detailEditUrl = computed(() =>
    detailUrl.value ? `/workshop/feats/${detailUrl.value}` : undefined,
  );

  watch([isSplitActive, detailUrl], ([splitActive, urlVal]) => {
    if (isRouterReady.value && !splitActive && urlVal) {
      navigateTo({
        name: 'feats-url',
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
   * Автоматический выбор первой черты в списке.
   */
  function autoSelectFirstFeat() {
    if (!isSplitActive.value || isDetailDismissed.value) {
      return;
    }

    const firstFeat = feats.value?.[0];

    if (firstFeat && !route.query.detail) {
      router.replace({
        query: {
          ...route.query,
          detail: firstFeat.url,
        },
      });
    }
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailUrl.value) {
      navigateTo({
        name: 'feats-url',
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

    autoSelectFirstFeat();
  });

  watch([feats, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirstFeat();
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
            href: `${getOrigin()}/feats/${detailUrl.value}`,
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
    title="Черты"
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
          v-else-if="status === 'success' && feats?.length"
          :items="feats"
          :reset-key="listResetKey"
          field="category"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <FeatLink :feat="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="feats"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailFeat?.name ?? ''"
        :source="detailFeat?.source"
        :date-time="detailFeat?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <FeatBody
          v-if="detailFeat"
          :feat="detailFeat"
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
            Черта не выбрана
          </h3>

          <p class="text-sm text-secondary">
            Выберите черту из списка слева, чтобы просмотреть подробную
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
