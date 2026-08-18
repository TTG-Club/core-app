<script setup lang="ts">
  import type { WritableComputedRef } from 'vue';

  import type {
    BugCountByStatusResponse,
    BugReportResponse,
    BugReportStatus,
    BugReportStatusUpdatePayload,
    PageBugReportResponse,
  } from '~bug-report/model';

  import { SOURCE_PLATFORMS } from '#shared/consts';
  import {
    AdminBugReportDetailPane,
    AdminBugReportRow,
  } from '~bug-report/admin/ui';
  import {
    ADMIN_BUG_SELECTED_DATA_KEY,
    ADMIN_BUGS_API_URL,
    ADMIN_BUGS_COUNT_BY_STATUS_API_URL,
    ADMIN_BUGS_DEFAULT_PAGE_SIZE,
    ADMIN_BUGS_DEFAULT_SORT,
    ADMIN_BUGS_DETAIL_EMPTY_TEXT,
    ADMIN_BUGS_DETAIL_EMPTY_TITLE,
    ADMIN_BUGS_EMPTY_TEXT,
    ADMIN_BUGS_FILTER_ALL,
    ADMIN_BUGS_ID_QUERY_KEY,
    ADMIN_BUGS_LAYOUT_TITLE,
    ADMIN_BUGS_LOAD_ERROR_TEXT,
    ADMIN_BUGS_PAGE_DESCRIPTION,
    ADMIN_BUGS_PAGE_TITLE,
    ADMIN_BUGS_PLATFORM_ALL_LABEL,
    ADMIN_BUGS_PLATFORM_QUERY_KEY,
    ADMIN_BUGS_RETRY_LABEL,
    ADMIN_BUGS_STAT_TOTAL_LABEL,
    ADMIN_BUGS_STATUS_ALL_LABEL,
    ADMIN_BUGS_STATUS_COUNTS_DATA_KEY,
    ADMIN_BUGS_STATUS_QUERY_KEY,
    applyBugStatusPatch,
    BUG_REPORT_DETAIL_DATE_FORMAT,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
    BUG_REPORT_STATUSES,
    getAdminBugApiUrl,
    getBugReportStatusColor,
  } from '~bug-report/model';
  import { UiPagination } from '~ui/pagination';

  const { isSplitActive } = useLayoutWidth();

  useSeoMeta({
    title: ADMIN_BUGS_PAGE_TITLE,
  });

  const route = useRoute();
  const router = useRouter();

  const currentPage = ref(1);
  const itemsPerPage = ADMIN_BUGS_DEFAULT_PAGE_SIZE;

  /**
   * Создает вычисляемый фильтр, синхронизированный с URL query.
   *
   * Значение из адреса принимается, только если оно есть среди допустимых:
   * иначе произвольная строка (`?status=foo`) ушла бы в API, где Spring не
   * сможет привести её к enum и ответит ошибкой на весь список.
   *
   * @param queryKey Ключ параметра в URL query.
   * @param allowedValues Допустимые значения фильтра.
   */
  function createQueryFilter(
    queryKey: string,
    allowedValues: ReadonlyArray<string>,
  ): WritableComputedRef<string> {
    return computed({
      get: () => {
        const queryValue = route.query[queryKey];

        return typeof queryValue === 'string'
          && allowedValues.includes(queryValue)
          ? queryValue
          : ADMIN_BUGS_FILTER_ALL;
      },
      set: (value) => {
        router.replace({
          query: {
            ...route.query,
            [queryKey]: value === ADMIN_BUGS_FILTER_ALL ? undefined : value,
            [ADMIN_BUGS_ID_QUERY_KEY]: undefined,
          },
        });
      },
    });
  }

  const statusFilter = createQueryFilter(
    ADMIN_BUGS_STATUS_QUERY_KEY,
    BUG_REPORT_STATUSES,
  );

  const platformFilter = createQueryFilter(
    ADMIN_BUGS_PLATFORM_QUERY_KEY,
    SOURCE_PLATFORMS,
  );

  // Синхронизация выбранного ID бага с URL query
  const selectedBugId = computed({
    get: () => {
      const queryId = route.query[ADMIN_BUGS_ID_QUERY_KEY];

      return typeof queryId === 'string' && queryId ? queryId : null;
    },
    set: (value) => {
      router.replace({
        query: {
          ...route.query,
          [ADMIN_BUGS_ID_QUERY_KEY]: value || undefined,
        },
      });
    },
  });

  /** Пункт селекта-фильтра: подпись и значение. */
  interface FilterOption {
    label: string;
    value: string;
  }

  // Опции фильтров не зависят от состояния страницы — считаются один раз
  const statusOptions: FilterOption[] = [
    { label: ADMIN_BUGS_STATUS_ALL_LABEL, value: ADMIN_BUGS_FILTER_ALL },
    ...BUG_REPORT_STATUSES.map((status) => ({
      label: BUG_REPORT_STATUS_LABELS[status],
      value: status,
    })),
  ];

  const platformOptions: FilterOption[] = [
    { label: ADMIN_BUGS_PLATFORM_ALL_LABEL, value: ADMIN_BUGS_FILTER_ALL },
    ...SOURCE_PLATFORMS.map((platform) => ({
      label: BUG_REPORT_PLATFORM_LABELS[platform],
      value: platform,
    })),
  ];

  // Сброс страницы и выделения при изменении фильтров
  watch([statusFilter, platformFilter], () => {
    currentPage.value = 1;
    selectedBugId.value = null;
  });

  const requestFetch = useRequestFetch();

  // Запрос баг-репортов с учетом пагинации и фильтров
  const {
    data: bugsData,
    status: bugsStatus,
    refresh: refreshBugs,
    error: bugsError,
  } = await useAsyncData<PageBugReportResponse>(
    'admin-bugs-list',
    () => {
      return requestFetch(ADMIN_BUGS_API_URL, {
        query: {
          page: currentPage.value - 1,
          size: itemsPerPage,
          sort: ADMIN_BUGS_DEFAULT_SORT,
          status:
            statusFilter.value === ADMIN_BUGS_FILTER_ALL
              ? undefined
              : statusFilter.value,
          sourcePlatform:
            platformFilter.value === ADMIN_BUGS_FILTER_ALL
              ? undefined
              : platformFilter.value,
        },
      });
    },
    {
      watch: [currentPage, statusFilter, platformFilter],
    },
  );

  const isBugsLoading = computed(() => bugsStatus.value === 'pending');
  const hasBugsError = computed(() => !!bugsError.value);
  const resolvedBugsList = computed(() => bugsData.value?.content ?? []);
  const totalBugsCount = computed(() => bugsData.value?.totalElements ?? 0);

  /** Повторяет загрузку списка после ошибки. */
  function handleRetry(): void {
    void refreshBugs();
  }

  // Сводка по статусам зависит только от платформы: цифры должны совпадать со
  // списком, но не схлопываться до одного статуса при фильтрации по статусу
  const { data: statusCounts, refresh: refreshStatusCounts } =
    await useAsyncData<BugCountByStatusResponse[]>(
      ADMIN_BUGS_STATUS_COUNTS_DATA_KEY,
      () =>
        requestFetch<BugCountByStatusResponse[]>(
          ADMIN_BUGS_COUNT_BY_STATUS_API_URL,
          {
            query: {
              sourcePlatform:
                platformFilter.value === ADMIN_BUGS_FILTER_ALL
                  ? undefined
                  : platformFilter.value,
            },
          },
        ),
      {
        watch: [platformFilter],
      },
    );

  /**
   * Строки сводки: статус, его подпись, цвет бейджа, количество багов и признак
   * того, что список сейчас отфильтрован именно по этому статусу.
   */
  const statusSummaryRows = computed(() => {
    return BUG_REPORT_STATUSES.map((status) => ({
      status,
      label: BUG_REPORT_STATUS_LABELS[status],
      color: getBugReportStatusColor(status),
      count:
        statusCounts.value?.find((statusCount) => statusCount.status === status)
          ?.count ?? 0,
      isActive: statusFilter.value === status,
    }));
  });

  /**
   * Общее количество баг-репортов. Статусы взаимоисключающие и покрывают все
   * баги, поэтому сумма сводки и есть общее число — отдельный запрос не нужен.
   */
  const totalFoundCount = computed(() => {
    return statusSummaryRows.value.reduce(
      (total, summaryRow) => total + summaryRow.count,
      0,
    );
  });

  /** Список показан без фильтра по статусу. */
  const isAllStatusesActive = computed(
    () => statusFilter.value === ADMIN_BUGS_FILTER_ALL,
  );

  /**
   * Отфильтровать список по конкретному статусу.
   *
   * @param status Статус баг-репорта.
   */
  function showBugsWithStatus(status: BugReportStatus): void {
    statusFilter.value = status;
  }

  /** Сбросить фильтр по статусу. */
  function showAllBugs(): void {
    statusFilter.value = ADMIN_BUGS_FILTER_ALL;
  }

  // Выбранный баг на основе ID из текущей страницы списка
  const selectedBugFromList = computed(() => {
    return resolvedBugsList.value.find(
      (bugReport) => bugReport.id === selectedBugId.value,
    );
  });

  // Догрузка бага по ID из URL: по прямой ссылке баг может отсутствовать
  // в загруженной странице списка (другая страница пагинации или фильтры)
  const { data: fetchedSelectedBug } =
    await useAsyncData<BugReportResponse | null>(
      ADMIN_BUG_SELECTED_DATA_KEY,
      () => {
        if (!selectedBugId.value || selectedBugFromList.value) {
          return Promise.resolve(null);
        }

        return requestFetch<BugReportResponse>(
          getAdminBugApiUrl(selectedBugId.value),
        );
      },
      {
        watch: [selectedBugId, bugsData],
      },
    );

  // Выбранный баг: из списка либо догруженный по ID
  const selectedBug = computed(
    () => selectedBugFromList.value ?? fetchedSelectedBug.value ?? undefined,
  );

  const { format } = useDayjs();

  /**
   * Форматированное время создания и изменения статуса для шапки детального просмотра.
   */
  const detailDateTime = computed(() => {
    const bug = selectedBug.value;

    if (!bug) {
      return '';
    }

    const created = format(bug.createdAt, BUG_REPORT_DETAIL_DATE_FORMAT);

    if (bug.statusUpdatedAt && bug.statusUpdatedAt !== bug.createdAt) {
      const updated = format(
        bug.statusUpdatedAt,
        BUG_REPORT_DETAIL_DATE_FORMAT,
      );

      return `${created} (Изменен: ${updated})`;
    }

    return created;
  });

  // Управление drawer в стандартном режиме (не split)
  const isDrawerOpen = computed({
    get: () => !isSplitActive.value && !!selectedBug.value,
    set: (open: boolean) => {
      if (!open) {
        selectedBugId.value = null;
      }
    },
  });

  /**
   * Устанавливает ID выбранного бага.
   *
   * @param id Уникальный идентификатор бага.
   */
  function selectBug(id: string): void {
    selectedBugId.value = id;
  }

  /**
   * Сбрасывает выбранный баг.
   */
  function closeDetail(): void {
    selectedBugId.value = null;
  }

  /**
   * Обновляет статус конкретного баг-репорта в локальном реактивном списке.
   *
   * @param payload Данные об обновлении статуса.
   */
  function handleBugStatusUpdate(payload: BugReportStatusUpdatePayload): void {
    // Статус сменился — сводка по статусам устарела
    void refreshStatusCounts();

    // Баг, догруженный по ID, обновляем отдельно — в списке его может не быть
    const loadedBug = fetchedSelectedBug.value;

    if (loadedBug && loadedBug.id === payload.id) {
      fetchedSelectedBug.value = applyBugStatusPatch(loadedBug, payload);
    }

    if (!bugsData.value) {
      return;
    }

    bugsData.value = {
      ...bugsData.value,
      content: bugsData.value.content.map((bugReport) => {
        return bugReport.id === payload.id
          ? applyBugStatusPatch(bugReport, payload)
          : bugReport;
      }),
    };
  }
</script>

<template>
  <div>
    <NuxtLayout
      name="section"
      :title="ADMIN_BUGS_LAYOUT_TITLE"
    >
      <!-- Элементы управления (Фильтры) -->
      <template #controls>
        <div class="flex flex-col gap-3">
          <p class="text-xs leading-normal text-secondary">
            {{ ADMIN_BUGS_PAGE_DESCRIPTION }}
          </p>

          <!-- Сводка по баг-репортам: всего и по каждому статусу (скрыта на мобильных) -->
          <div
            class="hidden overflow-hidden rounded-lg border border-default bg-elevated/50 lg:block"
          >
            <button
              type="button"
              :aria-pressed="isAllStatusesActive"
              class="flex w-full cursor-pointer flex-col px-3 py-2.5 text-left transition-colors hover:bg-elevated"
              :class="{ 'bg-elevated': isAllStatusesActive }"
              @click.left.exact.prevent="showAllBugs"
            >
              <span
                class="text-[10px] font-medium tracking-wider text-muted uppercase"
              >
                {{ ADMIN_BUGS_STAT_TOTAL_LABEL }}
              </span>

              <span
                class="text-lg leading-tight font-bold text-default tabular-nums"
              >
                {{ totalFoundCount }}
              </span>
            </button>

            <div class="flex flex-col border-t border-default">
              <button
                v-for="summaryRow in statusSummaryRows"
                :key="summaryRow.status"
                type="button"
                :aria-pressed="summaryRow.isActive"
                class="flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-elevated"
                :class="{ 'bg-elevated': summaryRow.isActive }"
                @click.left.exact.prevent="
                  showBugsWithStatus(summaryRow.status)
                "
              >
                <span class="truncate text-xs text-secondary">
                  {{ summaryRow.label }}
                </span>

                <UBadge
                  :color="summaryRow.color"
                  variant="subtle"
                  size="sm"
                  class="shrink-0 tabular-nums"
                >
                  {{ summaryRow.count }}
                </UBadge>
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <!-- Фильтр по статусу -->
            <USelectMenu
              v-model="statusFilter"
              :items="statusOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />

            <!-- Фильтр по платформе -->
            <USelectMenu
              v-model="platformFilter"
              :items="platformOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <!-- Основной список багов -->
      <template #default>
        <!-- Загрузка -->
        <div
          v-if="isBugsLoading"
          class="space-y-3 px-0 py-4 md:p-4"
        >
          <USkeleton
            v-for="index in 5"
            :key="index"
            class="h-14 w-full rounded-xl"
          />
        </div>

        <!-- Ошибка загрузки -->
        <div
          v-else-if="hasBugsError"
          class="py-12 text-center text-error"
        >
          {{ ADMIN_BUGS_LOAD_ERROR_TEXT }}

          <UButton
            variant="ghost"
            class="ml-2"
            @click.left.exact.prevent="handleRetry"
          >
            {{ ADMIN_BUGS_RETRY_LABEL }}
          </UButton>
        </div>

        <!-- Список компактных строк -->
        <div
          v-else-if="resolvedBugsList.length > 0"
          class="flex min-h-0 flex-col gap-3 overflow-y-auto px-0 py-4 md:p-4"
        >
          <AdminBugReportRow
            v-for="bugReport in resolvedBugsList"
            :key="bugReport.id"
            :bug-report="bugReport"
            :is-opened="selectedBugId === bugReport.id"
            @select="selectBug"
          />

          <!-- Пагинация -->
          <UiPagination
            v-if="totalBugsCount > itemsPerPage"
            v-model:page="currentPage"
            class="pt-4"
            :total="totalBugsCount"
            :items-per-page="itemsPerPage"
          />
        </div>

        <!-- Пустое состояние -->
        <div
          v-else
          class="py-12 text-center text-secondary"
        >
          {{ ADMIN_BUGS_EMPTY_TEXT }}
        </div>
      </template>

      <!-- Детальный просмотр бага справа -->
      <template #detail>
        <AdminBugReportDetailPane
          v-if="selectedBug"
          :bug="selectedBug"
          :date-time="detailDateTime"
          @close="closeDetail"
          @update-status="handleBugStatusUpdate"
        />

        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
        >
          <div class="flex max-w-xs flex-col items-center gap-3">
            <UIcon
              name="tabler:bug"
              class="size-10 text-muted/40"
            />

            <h3 class="text-lg font-semibold text-highlighted">
              {{ ADMIN_BUGS_DETAIL_EMPTY_TITLE }}
            </h3>

            <p class="text-sm text-secondary">
              {{ ADMIN_BUGS_DETAIL_EMPTY_TEXT }}
            </p>
          </div>
        </div>
      </template>
    </NuxtLayout>

    <!-- Drawer для стандартного режима (без split) -->
    <USlideover
      v-model:open="isDrawerOpen"
      :close="false"
      :ui="{
        content: 'w-full max-w-2xl',
      }"
    >
      <template #content>
        <AdminBugReportDetailPane
          v-if="selectedBug"
          :bug="selectedBug"
          :date-time="detailDateTime"
          @close="closeDetail"
          @update-status="handleBugStatusUpdate"
        />
      </template>
    </USlideover>
  </div>
</template>
