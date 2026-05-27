<script setup lang="ts">
  import type {
    BugReportStatus,
    PageBugReportResponse,
  } from '~bug-report/model';

  import {
    AdminBugReportDetail,
    AdminBugReportRow,
  } from '~bug-report/admin/ui';
  import {
    ADMIN_BUGS_EMPTY_TEXT,
    ADMIN_BUGS_PAGE_DESCRIPTION,
    ADMIN_BUGS_PAGE_TITLE,
    ADMIN_BUGS_PLATFORM_ALL_LABEL,
    ADMIN_BUGS_STATUS_ALL_LABEL,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
  } from '~bug-report/model';
  import { UiDetailPane } from '~ui/detail-pane';

  const { isSplitActive } = useLayoutWidth();

  useSeoMeta({
    title: ADMIN_BUGS_PAGE_TITLE,
  });

  const route = useRoute();
  const router = useRouter();

  const currentPage = ref(1);
  const statusFilter = ref('ALL');
  const platformFilter = ref('ALL');
  const itemsPerPage = 20;

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
    const options = [{ label: ADMIN_BUGS_STATUS_ALL_LABEL, value: 'ALL' }];

    Object.entries(BUG_REPORT_STATUS_LABELS).forEach(([key, value]) => {
      options.push({ label: value, value: key });
    });

    return options;
  });

  // Опции для фильтра платформ
  const platformOptions = computed(() => {
    const options = [{ label: ADMIN_BUGS_PLATFORM_ALL_LABEL, value: 'ALL' }];

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
      return requestFetch('/api/admin/bugs', {
        query: {
          page: currentPage.value - 1,
          size: itemsPerPage,
          sort: 'createdAt,desc',
          status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
          sourcePlatform:
            platformFilter.value === 'ALL' ? undefined : platformFilter.value,
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

    const created = format(bug.createdAt, 'LLL');

    if (bug.statusUpdatedAt && bug.statusUpdatedAt !== bug.createdAt) {
      const updated = format(bug.statusUpdatedAt, 'LLL');

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
  }): void {
    const bug = resolvedBugsList.value.find((item) => item.id === payload.id);

    if (bug) {
      bug.status = payload.status;
      bug.statusUpdatedAt = payload.statusUpdatedAt;
    }
  }
</script>

<template>
  <div>
    <NuxtLayout
      name="section"
      title="Баг-репорты"
    >
      <!-- Элементы управления (Фильтры) -->
      <template #controls>
        <div class="flex flex-col gap-3">
          <p class="text-xs leading-normal text-secondary">
            {{ ADMIN_BUGS_PAGE_DESCRIPTION }}
          </p>

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
        <UiDetailPane
          v-if="selectedBug"
          :title="`Баг-репорт #${selectedBug.id.slice(0, 8)}`"
          :date-time="detailDateTime"
          :url="selectedBug.url"
          copy-title
          @close="closeDetail"
        >
          <AdminBugReportDetail
            :bug-report="selectedBug"
            @update-status="handleBugStatusUpdate"
          />
        </UiDetailPane>

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
        <UiDetailPane
          v-if="selectedBug"
          :title="`Баг-репорт #${selectedBug.id.slice(0, 8)}`"
          :date-time="detailDateTime"
          :url="selectedBug.url"
          copy-title
          @close="closeDetail"
        >
          <AdminBugReportDetail
            :bug-report="selectedBug"
            @update-status="handleBugStatusUpdate"
          />
        </UiDetailPane>
      </template>
    </USlideover>
  </div>
</template>
