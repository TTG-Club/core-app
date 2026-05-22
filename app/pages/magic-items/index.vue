<script setup lang="ts">
  import type { FetchStatusValue } from '~/shared/consts';
  import type {
    MagicItemDetailResponse,
    MagicItemLinkResponse,
  } from '~magic-items/model';

  import { FetchStatus } from '~/shared/consts';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { MagicItemBody } from '~magic-items/body';
  import { useMagicItemRarityGroupOrder } from '~magic-items/composable';
  import { MagicItemLegend } from '~magic-items/legend';
  import { MagicItemLink } from '~magic-items/link';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  useSeoMeta({
    title: 'Магические предметы [Magic Items]',
    description: 'Магические предметы из D&D 5 (редакция 2024 года).',
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
  } = await useFilter('magic-items', '/api/v2/magic-items/filters');

  const { order: rarityOrder, pending: isRarityPending } =
    useMagicItemRarityGroupOrder();

  const {
    data: magicItems,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'magic-items',
    () =>
      $fetch<Array<MagicItemLinkResponse>>('/api/v2/magic-items/search', {
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

  const magicItemCache = createLruCache<string, MagicItemDetailResponse>(50);

  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const detailMagicItem = ref<MagicItemDetailResponse | null>(null);
  const detailStatus = ref<FetchStatusValue>(FetchStatus.Idle);

  /**
   * Загрузка детальных данных магического предмета по URL.
   * @param url Идентификатор магического предмета.
   */
  async function fetchMagicItemDetail(url: string): Promise<void> {
    if (!url) {
      detailMagicItem.value = null;
      detailStatus.value = FetchStatus.Idle;

      return;
    }

    if (magicItemCache.has(url)) {
      detailMagicItem.value = magicItemCache.get(url) || null;
      detailStatus.value = FetchStatus.Success;

      return;
    }

    detailStatus.value = FetchStatus.Pending;

    try {
      const response = await $fetch<MagicItemDetailResponse>(
        `/api/v2/magic-items/${url}`,
      );

      magicItemCache.set(url, response);
      detailMagicItem.value = response;
      detailStatus.value = FetchStatus.Success;
    } catch {
      detailMagicItem.value = null;
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

      fetchMagicItemDetail(url);
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
      ? `${getOrigin()}/magic-items/${detailUrl.value}`
      : undefined,
  );

  const detailEditUrl = computed(() =>
    detailUrl.value ? `/workshop/magic-items/${detailUrl.value}` : undefined,
  );

  watch([isSplitActive, detailUrl], ([splitActive, urlVal]) => {
    if (isRouterReady.value && !splitActive && urlVal) {
      navigateTo({
        name: 'magic-items-url',
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
   * Автоматический выбор первого магического предмета в списке.
   */
  function autoSelectFirstMagicItem() {
    if (!isSplitActive.value || isDetailDismissed.value) {
      return;
    }

    const firstMagicItem = magicItems.value?.[0];

    if (firstMagicItem && !route.query.detail) {
      router.replace({
        query: {
          ...route.query,
          detail: firstMagicItem.url,
        },
      });
    }
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailUrl.value) {
      navigateTo({
        name: 'magic-items-url',
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

    autoSelectFirstMagicItem();
  });

  watch([magicItems, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirstMagicItem();
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
            href: `${getOrigin()}/magic-items/${detailUrl.value}`,
          },
        ],
      };
    }

    return {};
  });

  const isLoading = computed(() => {
    const isItemsLoading =
      status.value !== 'success' && status.value !== 'error';

    return isItemsLoading || isRarityPending.value;
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
    title="Магические предметы"
  >
    <template #controls>
      <FilterControls
        v-model:search="search"
        v-model:filter="filter"
        :defaults="filterDefaults"
        :is-pending="isFilterPending"
        :show-preview="isFilterPreviewShowed"
      >
        <template #legend>
          <MagicItemLegend />
        </template>
      </FilterControls>
    </template>

    <template #default>
      <Transition
        name="fade"
        mode="out-in"
      >
        <PageGrid
          v-if="isLoading"
          :columns="3"
        >
          <SkeletonLinkSmall
            v-for="index in 5"
            :key="index"
          />
        </PageGrid>

        <GroupedList
          v-else-if="status === 'success' && magicItems?.length"
          :items="magicItems"
          :reset-key="listResetKey"
          field="rarity"
          :group-sort="{
            mode: 'ordered',
            order: rarityOrder,
            unknown: 'after',
          }"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <MagicItemLink :magic-item="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="magicItems"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailMagicItem?.name ?? ''"
        :source="detailMagicItem?.source"
        :date-time="detailMagicItem?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <MagicItemBody
          v-if="detailMagicItem"
          :magic-item="detailMagicItem"
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
            Магический предмет не выбран
          </h3>

          <p class="text-sm text-secondary">
            Выберите магический предмет из списка слева, чтобы просмотреть
            подробную информацию
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
