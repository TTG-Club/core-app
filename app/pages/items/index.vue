<script setup lang="ts">
  import type { FetchStatusValue } from '~/shared/consts';
  import type { ItemDetailResponse, ItemLinkResponse } from '~items/model';

  import { FetchStatus } from '~/shared/consts';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { ItemBody } from '~items/body';
  import { ItemLink } from '~items/link';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Предметы [Items]',
    description: 'Предметы из D&D 5 (редакция 2024 года).',
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
  } = await useFilter('items', '/api/v2/item/filters');

  const {
    data: items,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'items',
    () =>
      $fetch<Array<ItemLinkResponse>>('/api/v2/item/search', {
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

  const itemCache = createLruCache<string, ItemDetailResponse>(50);

  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const detailItem = ref<ItemDetailResponse | null>(null);
  const detailStatus = ref<FetchStatusValue>(FetchStatus.Idle);

  /**
   * Загрузка детальных данных предмета по URL.
   * @param url Идентификатор предмета.
   */
  async function fetchItemDetail(url: string): Promise<void> {
    if (!url) {
      detailItem.value = null;
      detailStatus.value = FetchStatus.Idle;

      return;
    }

    if (itemCache.has(url)) {
      detailItem.value = itemCache.get(url) || null;
      detailStatus.value = FetchStatus.Success;

      return;
    }

    detailStatus.value = FetchStatus.Pending;

    try {
      const response = await $fetch<ItemDetailResponse>(`/api/v2/item/${url}`);

      itemCache.set(url, response);
      detailItem.value = response;
      detailStatus.value = FetchStatus.Success;
    } catch {
      detailItem.value = null;
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

      fetchItemDetail(url);
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
    detailUrl.value ? `${getOrigin()}/items/${detailUrl.value}` : undefined,
  );

  const detailEditUrl = computed(() =>
    detailUrl.value ? `/workshop/items/${detailUrl.value}` : undefined,
  );

  watch([isSplitActive, detailUrl], ([splitActive, urlVal]) => {
    if (isRouterReady.value && !splitActive && urlVal) {
      navigateTo({
        name: 'items-url',
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
   * Автоматический выбор первого предмета в списке.
   */
  function autoSelectFirstItem() {
    if (!isSplitActive.value || isDetailDismissed.value) {
      return;
    }

    const firstItem = items.value?.[0];

    if (firstItem && !route.query.detail) {
      router.replace({
        query: {
          ...route.query,
          detail: firstItem.url,
        },
      });
    }
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailUrl.value) {
      navigateTo({
        name: 'items-url',
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

    autoSelectFirstItem();
  });

  watch([items, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirstItem();
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
            href: `${getOrigin()}/items/${detailUrl.value}`,
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
    title="Предметы"
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
          v-else-if="status === 'success' && items?.length"
          :items="items"
          :reset-key="listResetKey"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <ItemLink :item="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="items"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailItem?.name ?? ''"
        :source="detailItem?.source"
        :date-time="detailItem?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <ItemBody
          v-if="detailItem"
          :item="detailItem"
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
            Предмет не выбран
          </h3>

          <p class="text-sm text-secondary">
            Выберите предмет из списка слева, чтобы просмотреть подробную
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
