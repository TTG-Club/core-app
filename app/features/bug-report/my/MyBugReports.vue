<script setup lang="ts">
  import type { MyBugReportResponse } from '../model';

  import { UiPagination } from '~ui/pagination';

  import {
    MY_BUGS_DESCRIPTION,
    MY_BUGS_EMPTY_FILTERED_TEXT,
    MY_BUGS_EMPTY_FILTERED_TITLE,
    MY_BUGS_EMPTY_TEXT,
    MY_BUGS_EMPTY_TITLE,
    MY_BUGS_LOAD_ERROR_TEXT,
    MY_BUGS_PAGE_SIZE,
    MY_BUGS_RETRY_LABEL,
    MY_BUGS_TITLE,
  } from '../model';
  import {
    useMyBugReportReadState,
    useMyBugReports,
    useMyBugReportUpdates,
  } from './composables';
  import { MyBugReportCard, MyBugReportsSummary } from './ui';

  const {
    bugReports,
    statusCounts,
    currentPage,
    statusFilter,
    totalCount,
    totalStatusCount,
    isLoading,
    hasError,
    reload,
  } = useMyBugReports();

  const { lastStatusUpdatedAt, markSeenUpTo } = useMyBugReportUpdates();

  const { resolveChanges, markRead } = useMyBugReportReadState();

  /**
   * Самая свежая дата изменения среди загруженных репортов. Даты приходят от
   * одного сервиса в формате `YYYY-MM-DDTHH:mm:ss`, поэтому сравниваются как
   * строки — лексикографический порядок здесь совпадает с хронологическим.
   */
  const loadedLastStatusUpdatedAt = computed(() =>
    bugReports.value.reduce(
      (latest, bugReport) =>
        bugReport.statusUpdatedAt && bugReport.statusUpdatedAt > latest
          ? bugReport.statusUpdatedAt
          : latest,
      '',
    ),
  );

  /**
   * Сводка знает об изменении, которого нет в загруженном списке. Сводка
   * опрашивается фоном, так что это и есть сигнал «модератор что-то сделал».
   * Сравнение со списком, а не с прошлым значением сводки, заодно избавляет от
   * лишней перезагрузки сразу после открытия раздела.
   */
  const hasUnloadedChange = computed(
    () =>
      !!lastStatusUpdatedAt.value
      && bugReports.value.length > 0
      && lastStatusUpdatedAt.value > loadedLastStatusUpdatedAt.value,
  );

  watch(hasUnloadedChange, (value) => {
    if (value) {
      void reload();
    }
  });

  /**
   * Репорт рассмотрели: сохраняем снимок его состояния и двигаем общую отметку
   * просмотра — вместе с ней гаснут точки у вкладки, шлема и в его меню.
   *
   * @param bugReport Прочитанный баг-репорт.
   */
  function handleRead(bugReport: MyBugReportResponse): void {
    markRead(bugReport);
    markSeenUpTo(bugReport.statusUpdatedAt);
  }

  const isEmpty = computed(
    () => !isLoading.value && bugReports.value.length === 0,
  );

  const isFiltered = computed(() => statusFilter.value !== null);

  const emptyTitle = computed(() =>
    isFiltered.value ? MY_BUGS_EMPTY_FILTERED_TITLE : MY_BUGS_EMPTY_TITLE,
  );

  const emptyText = computed(() =>
    isFiltered.value ? MY_BUGS_EMPTY_FILTERED_TEXT : MY_BUGS_EMPTY_TEXT,
  );

  /** Повторяет загрузку списка после ошибки. */
  function handleRetry(): void {
    void reload();
  }
</script>

<template>
  <div class="space-y-6">
    <UCard :ui="{ header: 'px-6 py-4', body: 'p-6' }">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:bug"
            class="h-5 w-5 text-primary"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">{{ MY_BUGS_TITLE }}</h3>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm leading-relaxed text-secondary">
          {{ MY_BUGS_DESCRIPTION }}
        </p>

        <!-- Сводка из одних нулей ничего не сообщает: у новичка её не показываем -->
        <MyBugReportsSummary
          v-if="totalStatusCount > 0"
          v-model="statusFilter"
          :status-counts="statusCounts"
          :total-count="totalStatusCount"
        />
      </div>
    </UCard>

    <!-- Загрузка -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-32 w-full rounded-xl"
      />
    </div>

    <!-- Ошибка загрузки -->
    <div
      v-else-if="hasError"
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-default bg-elevated p-8 text-center"
    >
      <p class="text-sm text-error">{{ MY_BUGS_LOAD_ERROR_TEXT }}</p>

      <UButton
        :label="MY_BUGS_RETRY_LABEL"
        color="neutral"
        variant="outline"
        size="sm"
        icon="tabler:refresh"
        @click.left.exact.prevent="handleRetry"
      />
    </div>

    <!-- Пустое состояние -->
    <div
      v-else-if="isEmpty"
      class="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-default bg-elevated p-8"
    >
      <UEmpty
        icon="tabler:bug-off"
        :title="emptyTitle"
        :description="emptyText"
      />
    </div>

    <!-- Список баг-репортов -->
    <div
      v-else
      class="space-y-3"
    >
      <MyBugReportCard
        v-for="bugReport in bugReports"
        :key="bugReport.id"
        :bug-report="bugReport"
        :changes="resolveChanges(bugReport)"
        @read="handleRead"
      />

      <UiPagination
        v-if="totalCount > MY_BUGS_PAGE_SIZE"
        v-model:page="currentPage"
        class="pt-2"
        :total="totalCount"
        :items-per-page="MY_BUGS_PAGE_SIZE"
      />
    </div>
  </div>
</template>
