<script setup lang="ts">
  import type { FetchStatusValue } from '~/shared/consts';
  import type {
    BackgroundDetailResponse,
    BackgroundLinkResponse,
  } from '~backgrounds/model';

  import { FetchStatus } from '~/shared/consts';
  import { BackgroundBody } from '~backgrounds/body';
  import { BackgroundLink } from '~backgrounds/link';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Предыстории [Backgrounds]',
    description: 'Предыстории из D&D 5 (редакция 2024 года).',
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
  } = await useFilter('backgrounds', '/api/v2/backgrounds/filters');

  const {
    data: backgrounds,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'backgrounds',
    () =>
      $fetch<Array<BackgroundLinkResponse>>('/api/v2/backgrounds/search', {
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

  const backgroundCache = createLruCache<string, BackgroundDetailResponse>(50);

  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const detailBackground = ref<BackgroundDetailResponse | null>(null);
  const detailStatus = ref<FetchStatusValue>(FetchStatus.Idle);

  /**
   * Загрузка детальных данных предыстории по URL.
   * @param url Идентификатор предыстории.
   */
  async function fetchBackgroundDetail(url: string): Promise<void> {
    if (!url) {
      detailBackground.value = null;
      detailStatus.value = FetchStatus.Idle;

      return;
    }

    if (backgroundCache.has(url)) {
      detailBackground.value = backgroundCache.get(url) || null;
      detailStatus.value = FetchStatus.Success;

      return;
    }

    detailStatus.value = FetchStatus.Pending;

    try {
      const response = await $fetch<BackgroundDetailResponse>(
        `/api/v2/backgrounds/${url}`,
      );

      backgroundCache.set(url, response);
      detailBackground.value = response;
      detailStatus.value = FetchStatus.Success;
    } catch {
      detailBackground.value = null;
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

      fetchBackgroundDetail(url);
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
    detailUrl.value
      ? `${getOrigin()}/backgrounds/${detailUrl.value}`
      : undefined,
  );

  const detailEditUrl = computed(() =>
    detailUrl.value ? `/workshop/backgrounds/${detailUrl.value}` : undefined,
  );

  watch([isSplitActive, detailUrl], ([splitActive, urlVal]) => {
    if (isRouterReady.value && !splitActive && urlVal) {
      navigateTo({
        name: 'backgrounds-url',
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
   * Автоматический выбор первой предыстории в списке.
   */
  function autoSelectFirstBackground() {
    if (!isSplitActive.value || isDetailDismissed.value) {
      return;
    }

    const firstBackground = backgrounds.value?.[0];

    if (firstBackground && !route.query.detail) {
      router.replace({
        query: {
          ...route.query,
          detail: firstBackground.url,
        },
      });
    }
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailUrl.value) {
      navigateTo({
        name: 'backgrounds-url',
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

    autoSelectFirstBackground();
  });

  watch([backgrounds, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirstBackground();
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
            href: `${getOrigin()}/backgrounds/${detailUrl.value}`,
          },
        ],
      };
    }

    return {};
  });
</script>

<template>
  <NuxtLayout
    name="section"
    title="Предыстории"
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
          v-else-if="status === 'success' && backgrounds?.length"
          :items="backgrounds"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <BackgroundLink :background="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="backgrounds"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailBackground?.name ?? ''"
        :source="detailBackground?.source"
        :date-time="detailBackground?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <BackgroundBody
          v-if="detailBackground"
          :background="detailBackground"
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
            Предыстория не выбрана
          </h3>

          <p class="text-sm text-secondary">
            Выберите предысторию из списка слева, чтобы просмотреть подробную
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
