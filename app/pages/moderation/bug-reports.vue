<script setup lang="ts">
  import type { WritableComputedRef } from 'vue';

  import type {
    BugReportStatsResponse,
    BugReportStatus,
    PageBugReportResponse,
  } from '~bug-report/model';

  import {
    AdminBugReportDetailPane,
    AdminBugReportRow,
  } from '~bug-report/admin/ui';
  import {
    ADMIN_BUGS_API_URL,
    ADMIN_BUGS_DEFAULT_PAGE_SIZE,
    ADMIN_BUGS_DEFAULT_SORT,
    ADMIN_BUGS_EMPTY_TEXT,
    ADMIN_BUGS_FILTER_ALL,
    ADMIN_BUGS_LAYOUT_TITLE,
    ADMIN_BUGS_PAGE_DESCRIPTION,
    ADMIN_BUGS_PAGE_TITLE,
    ADMIN_BUGS_PLATFORM_ALL_LABEL,
    ADMIN_BUGS_STAT_FIXED_LABEL,
    ADMIN_BUGS_STAT_TOTAL_LABEL,
    ADMIN_BUGS_STATS_DATA_KEY,
    ADMIN_BUGS_STATUS_ALL_LABEL,
    BUG_REPORT_DETAIL_DATE_FORMAT,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATS_API_URL,
    BUG_REPORT_STATUS_LABELS,
  } from '~bug-report/model';

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
   * @param queryKey Ключ параметра в URL query.
   */
  function createQueryFilter(queryKey: string): WritableComputedRef<string> {
    return computed({
      get: () => {
        const queryValue = route.query[queryKey];

        return typeof queryValue === 'string' && queryValue
          ? queryValue
          : ADMIN_BUGS_FILTER_ALL;
      },
      set: (value) => {
        router.replace({
          query: {
            ...route.query,
            [queryKey]: value === ADMIN_BUGS_FILTER_ALL ? undefined : value,
            id: undefined,
          },
        });
      },
    });
  }

  const statusFilter = createQueryFilter('status');
  const platformFilter = createQueryFilter('platform');

  // Синхронизация выбранного ID бага с URL query
  const selectedBugId = computed({
    get: () => {
      const queryId = route.query.id;

      return typeof queryId === 'string' && queryId ? queryId : null;
    },
    set: (value) => {
      router.replace({
        query: {
          ...route.query,
          id: value || undefined,
        },
      });
    },
  });

  // Опции для фильтра статусов
  const statusOptions = computed(() => {
    const options = [
      { label: ADMIN_BUGS_STATUS_ALL_LABEL, value: ADMIN_BUGS_FILTER_ALL },
    ];

    Object.entries(BUG_REPORT_STATUS_LABELS).forEach(([key, value]) => {
      options.push({ label: value, value: key });
    });

    return options;
  });

  // Опции для фильтра платформ
  const platformOptions = computed(() => {
    const options = [
      { label: ADMIN_BUGS_PLATFORM_ALL_LABEL, value: ADMIN_BUGS_FILTER_ALL },
    ];

    Object.entries(BUG_REPORT_PLATFORM_LABELS).forEach(([key, value]) => {
      options.push({ label: value, value: key });
    });

    return options;
  });

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

  // Сводная статистика по всем баг-репортам (не зависит от фильтров)
  const { data: bugStats } = await useAsyncData<BugReportStatsResponse>(
    ADMIN_BUGS_STATS_DATA_KEY,
    () => requestFetch<BugReportStatsResponse>(BUG_REPORT_STATS_API_URL),
  );

  const totalFoundCount = computed(() => bugStats.value?.totalCount ?? 0);
  const fixedFoundCount = computed(() => bugStats.value?.fixedCount ?? 0);

  /** Отфильтровать список по новым баг-репортам. */
  function showNewBugs(): void {
    const status: BugReportStatus = 'NEW';

    statusFilter.value = status;
  }

  /** Отфильтровать список по исправленным баг-репортам. */
  function showFixedBugs(): void {
    const status: BugReportStatus = 'FIXED';

    statusFilter.value = status;
  }

  // Выбранный баг на основе ID из списка
  const selectedBug = computed(() => {
    return resolvedBugsList.value.find(
      (bugReport) => bugReport.id === selectedBugId.value,
    );
  });

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
  function handleBugStatusUpdate(payload: {
    id: string;
    status: BugReportStatus;
    statusUpdatedAt: string;
    statusUpdatedBy?: string | null;
    statusComment?: string;
  }): void {
    if (!bugsData.value) {
      return;
    }

    bugsData.value = {
      ...bugsData.value,
      content: bugsData.value.content.map((item) => {
        if (item.id === payload.id) {
          return {
            ...item,
            status: payload.status,
            statusUpdatedAt: payload.statusUpdatedAt,
            statusUpdatedBy: payload.statusUpdatedBy,
            statusComment: payload.statusComment,
          };
        }

        return item;
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

          <!-- Сводная статистика по баг-репортам (скрыта на мобильных) -->
          <div class="hidden flex-col gap-2 lg:flex">
            <button
              type="button"
              class="flex cursor-pointer flex-col rounded-lg border border-default bg-elevated/50 px-3 py-2.5 text-left transition-colors hover:bg-elevated"
              @click.left.exact.prevent="showNewBugs"
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

            <button
              type="button"
              class="flex cursor-pointer flex-col rounded-lg border border-default bg-elevated/50 px-3 py-2.5 text-left transition-colors hover:bg-elevated"
              @click.left.exact.prevent="showFixedBugs"
            >
              <span
                class="text-[10px] font-medium tracking-wider text-muted uppercase"
              >
                {{ ADMIN_BUGS_STAT_FIXED_LABEL }}
              </span>

              <span
                class="text-lg leading-tight font-bold text-success-400 tabular-nums"
              >
                {{ fixedFoundCount }}
              </span>
            </button>
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
          Не удалось загрузить список баг-репортов.
          <UButton
            variant="ghost"
            class="ml-2"
            @click.left.exact.prevent="() => refreshBugs()"
          >
            Повторить попытку
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
          <div
            v-if="totalBugsCount > itemsPerPage"
            class="flex justify-center pt-4"
          >
            <UPagination
              v-model:page="currentPage"
              :total="totalBugsCount"
              :items-per-page="itemsPerPage"
              show-edges
              :sibling-count="1"
            />
          </div>
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
              Баг-репорт не выбран
            </h3>

            <p class="text-sm text-secondary">
              Выберите сообщение об ошибке из списка слева, чтобы просмотреть
              подробную информацию
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
