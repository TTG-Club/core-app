<script setup lang="ts">
  import type { FetchStatusValue } from '~/shared/consts';
  import type {
    SpellDetailResponse,
    SpellLinkResponse,
    SpellSearchPageResponse,
    SpellSearchResponse,
  } from '~spells/model';

  import { FetchStatus } from '~/shared/consts';
  import { FilterControls, useFilter } from '~infrastructure/filter';
  import { SpellBody } from '~spells/body';
  import { SpellLegend } from '~spells/legend';
  import { SpellLink } from '~spells/link';
  import {
    SPELL_LIST_LOAD_MORE_DISTANCE,
    SPELL_LIST_PAGE_SIZE,
  } from '~spells/model';
  import { UiDetailPane } from '~ui/detail-pane';
  import { GroupedList } from '~ui/grouped-list';
  import { PageGrid, PageResult } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  function getSpellLevelLabel(level: number | string): string {
    if (typeof level === 'string') {
      return level;
    }

    return !level ? 'Заговоры' : `Уровень ${level}`;
  }

  useSeoMeta({
    title: 'Заклинания [Spells]',
    description: 'Заклинания из D&D 5 (редакция 2024 года).',
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
  } = await useFilter('spells', '/api/v2/spells/filters');

  const currentPage = ref(0);
  const spells = ref<Array<SpellLinkResponse>>([]);
  const hasNextPage = ref(false);
  const isLoadingMore = ref(false);

  // Локальный LRU-кэш для детальной информации о заклинаниях (максимум 50 записей)
  const spellCache = createLruCache<string, SpellDetailResponse>(50);

  // Вычисляем выбранный URL заклинания из query-параметров
  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  // Реактивное состояние детальной информации о заклинании
  const detailSpell = ref<SpellDetailResponse | null>(null);
  const detailStatus = ref<FetchStatusValue>(FetchStatus.Idle);

  /**
   * Загрузка детальных данных заклинания по URL.
   * @param url Идентификатор заклинания.
   */
  async function fetchSpellDetail(url: string): Promise<void> {
    if (!url) {
      detailSpell.value = null;
      detailStatus.value = FetchStatus.Idle;

      return;
    }

    if (spellCache.has(url)) {
      detailSpell.value = spellCache.get(url) || null;
      detailStatus.value = FetchStatus.Success;

      return;
    }

    detailStatus.value = FetchStatus.Pending;

    try {
      const response = await $fetch<SpellDetailResponse>(
        `/api/v2/spells/${url}`,
      );

      spellCache.set(url, response);
      detailSpell.value = response;
      detailStatus.value = FetchStatus.Success;
    } catch {
      detailSpell.value = null;
      detailStatus.value = FetchStatus.Error;
    }
  }

  // Флаг, определяющий, что пользователь ЯВНО закрыл деталь (нажал крестик)
  const isDetailDismissed = ref(false);

  /**
   * Флаг, определяющий готовность роутера на клиенте.
   */
  const isRouterReady = ref(false);

  // Загрузка детальных данных и сброс флага при изменении выбранного заклинания
  watch(
    detailUrl,
    (url) => {
      if (url) {
        isDetailDismissed.value = false;
      }

      fetchSpellDetail(url);
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
    detailUrl.value ? `${getOrigin()}/spells/${detailUrl.value}` : undefined,
  );

  const detailEditUrl = computed(() =>
    detailUrl.value ? `/workshop/spells/${detailUrl.value}` : undefined,
  );

  // Перенаправление на детальную страницу при выходе из широкого режима
  watch([isSplitActive, detailUrl], ([splitActive, urlVal]) => {
    if (isRouterReady.value && !splitActive && urlVal) {
      navigateTo({
        name: 'spells-url',
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
   * Автоматический выбор первого заклинания в списке.
   */
  function autoSelectFirstSpell() {
    if (!isSplitActive.value || isDetailDismissed.value) {
      return;
    }

    const firstSpell = spells.value[0];

    if (firstSpell) {
      const currentDetail = route.query.detail;

      // Выбираем первое заклинание только если в URL пусто
      if (!currentDetail) {
        router.replace({
          query: {
            ...route.query,
            detail: firstSpell.url,
          },
        });
      }
    }
  }

  // Вызов автовыбора при монтировании на клиенте после готовности роутера
  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    // На мобильных устройствах при наличии query-параметра detail перенаправляем на отдельную страницу
    if (!isSplitActive.value && detailUrl.value) {
      navigateTo({
        name: 'spells-url',
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

    autoSelectFirstSpell();
  });

  // Отслеживание изменений списка или режима для автовыбора
  watch([spells, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirstSpell();
    }
  });

  /**
   * Закрытие детальной панели (очистка query-параметра detail).
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

  // Добавление canonical ссылки для SEO
  useHead(() => {
    if (isSplitActive.value && detailUrl.value) {
      return {
        link: [
          {
            rel: 'canonical',
            href: `${getOrigin()}/spells/${detailUrl.value}`,
          },
        ],
      };
    }

    return {};
  });

  // Динамический таргет для бесконечного скролла
  // В стандартном режиме — window с большим distance (900px),
  // в Wide Mode — контейнер списка с аналогичным distance (900px) для своевременной подгрузки.
  const windowScrollTarget = computed(() =>
    import.meta.client && !isSplitActive.value ? window : null,
  );

  const splitScrollTarget = shallowRef<HTMLElement | null>(null);

  /**
   * Поиск DOM-контейнера для скролла в Wide Mode.
   * Использует requestAnimationFrame для повторной попытки,
   * т.к. элемент может ещё не быть в DOM при первом вызове.
   */
  function resolveSplitContainer(): void {
    const container = document.getElementById('section-list-container');

    if (container) {
      splitScrollTarget.value = container;

      return;
    }

    requestAnimationFrame(() => {
      splitScrollTarget.value = document.getElementById(
        'section-list-container',
      );
    });
  }

  if (import.meta.client) {
    onMounted(() => {
      watch(
        isSplitActive,
        (active) => {
          if (active) {
            resolveSplitContainer();
          } else {
            splitScrollTarget.value = null;
          }
        },
        { immediate: true },
      );
    });
  }

  const listResetKey = computed(() =>
    JSON.stringify({
      filter: filterQuery.value,
      search: search.value ?? '',
    }),
  );

  const { hasSavedPosition, rememberCurrentPage, savedItemKey, savedPage } =
    useSectionListScroll('spells', listResetKey);

  const isRestoringSavedPage = ref(false);

  const firstSpellPageSize = computed(() => {
    return hasSavedPosition.value && typeof savedPage.value === 'number'
      ? (savedPage.value + 1) * SPELL_LIST_PAGE_SIZE
      : SPELL_LIST_PAGE_SIZE;
  });

  // Целевой URL заклинания для прокрутки/загрузки: либо сохраненный из скролла, либо из URL
  const targetSpellUrl = computed(() => {
    if (savedItemKey.value) {
      return savedItemKey.value;
    }

    return detailUrl.value;
  });

  const isTargetSpellLoaded = computed(() => {
    const targetUrl = targetSpellUrl.value;

    if (!targetUrl) {
      return true;
    }

    return spells.value.some((spell) => spell.url === targetUrl);
  });

  const isTargetSpellRestorePending = computed(() => {
    return (
      (hasSavedPosition.value || detailUrl.value)
      && !isTargetSpellLoaded.value
      && hasNextPage.value
    );
  });

  function normalizeSpellPage(
    response: SpellSearchResponse | null | undefined,
  ): SpellSearchPageResponse {
    if (Array.isArray(response)) {
      return {
        value: response,
        Count: response.length,
      };
    }

    return {
      value: response?.value ?? [],
      Count: response?.Count ?? 0,
    };
  }

  async function fetchSpellPage(
    page: number,
    size: number = SPELL_LIST_PAGE_SIZE,
  ): Promise<SpellSearchPageResponse> {
    const response = await $fetch<SpellSearchResponse>(
      '/api/v2/spells/search',
      {
        method: 'GET',
        query: {
          page,
          size,
          ...(search.value ? { search: search.value } : {}),
          ...filterQuery.value,
        },
      },
    );

    return normalizeSpellPage(response);
  }

  const {
    data: firstSpellPage,
    error,
    status,
    refresh,
  } = await useAsyncData(
    'spells-search-page',
    () => fetchSpellPage(0, firstSpellPageSize.value),
    {
      deep: false,
      watch: [search, filterQuery],
    },
  );

  watch(
    firstSpellPage,
    (page) => {
      currentPage.value = 0;
      spells.value = page?.value ?? [];

      currentPage.value = Math.max(
        0,
        Math.ceil(spells.value.length / SPELL_LIST_PAGE_SIZE) - 1,
      );

      hasNextPage.value = (page?.Count ?? 0) === firstSpellPageSize.value;
    },
    { immediate: true },
  );

  async function loadNextSpellPage(): Promise<void> {
    if (isLoadingMore.value || !hasNextPage.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      const nextPage = currentPage.value + 1;
      const page = await fetchSpellPage(nextPage);

      currentPage.value = nextPage;
      spells.value = [...spells.value, ...page.value];
      hasNextPage.value = page.Count === SPELL_LIST_PAGE_SIZE;
    } finally {
      isLoadingMore.value = false;
    }
  }

  /**
   * Восстановление сохраненных страниц заклинаний до целевого элемента.
   */
  async function restoreSavedSpellPages(): Promise<void> {
    const targetUrl = targetSpellUrl.value;

    if (!targetUrl || isRestoringSavedPage.value || isTargetSpellLoaded.value) {
      return;
    }

    isRestoringSavedPage.value = true;

    try {
      while (hasNextPage.value && !isTargetSpellLoaded.value) {
        if (isLoadingMore.value) {
          await until(isLoadingMore).toBe(false);

          continue;
        }

        await loadNextSpellPage();
      }
    } finally {
      isRestoringSavedPage.value = false;
    }
  }

  useInfiniteScroll(windowScrollTarget, loadNextSpellPage, {
    distance: SPELL_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () => hasNextPage.value && !isLoadingMore.value,
  });

  useInfiniteScroll(splitScrollTarget, loadNextSpellPage, {
    distance: SPELL_LIST_LOAD_MORE_DISTANCE,
    canLoadMore: () => hasNextPage.value && !isLoadingMore.value,
  });

  function rememberSavedSpellPage(): void {
    const savedSpellUrl = savedItemKey.value;

    if (!savedSpellUrl) {
      return;
    }

    const savedSpellIndex = spells.value.findIndex((spell) => {
      return spell.url === savedSpellUrl;
    });

    if (savedSpellIndex < 0) {
      return;
    }

    rememberCurrentPage(Math.floor(savedSpellIndex / SPELL_LIST_PAGE_SIZE));
  }

  watch(savedItemKey, rememberSavedSpellPage, { flush: 'sync' });

  watch(
    [spells, targetSpellUrl],
    () => {
      restoreSavedSpellPages();
    },
    {
      flush: 'post',
      immediate: true,
    },
  );

  const isLoading = computed(
    () =>
      (status.value !== 'success' && status.value !== 'error')
      || isRestoringSavedPage.value
      || isTargetSpellRestorePending.value,
  );
</script>

<template>
  <NuxtLayout
    name="section"
    title="Заклинания"
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
          <SpellLegend />
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
          v-else-if="status === 'success' && spells.length"
          virtual
          :virtual-threshold="SPELL_LIST_PAGE_SIZE"
          :reset-key="listResetKey"
          :separator-label="getSpellLevelLabel"
          :items="spells"
          field="level"
          :active-item-key="detailUrl"
        >
          <template #default="{ item }">
            <SpellLink :spell="item" />
          </template>
        </GroupedList>

        <PageResult
          v-else
          :items="spells"
          :status
          :error
          @refresh="refresh"
        />
      </Transition>
    </template>

    <template #detail>
      <UiDetailPane
        v-if="detailUrl"
        :title="detailSpell?.name ?? ''"
        :source="detailSpell?.source"
        :date-time="detailSpell?.updatedAt"
        :url="detailUrlForCopy"
        :edit-url="detailEditUrl"
        :is-loading="isDetailLoading"
        :is-error="isDetailError"
        copy-title
        @close="handleCloseDetail"
      >
        <SpellBody
          v-if="detailSpell"
          :spell="detailSpell"
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
            Заклинание не выбрано
          </h3>

          <p class="text-sm text-secondary">
            Выберите заклинание из списка слева, чтобы просмотреть подробную
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
