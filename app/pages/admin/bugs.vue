<script setup lang="ts">
  import type { PageBugReportResponse } from '~bug-report/model';

  import { AdminBugReportCard } from '~bug-report/admin/ui';
  import {
    ADMIN_BUGS_EMPTY_TEXT,
    ADMIN_BUGS_PAGE_DESCRIPTION,
    ADMIN_BUGS_PAGE_TITLE,
    ADMIN_BUGS_PLATFORM_ALL_LABEL,
    ADMIN_BUGS_STATUS_ALL_LABEL,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
  } from '~bug-report/model';

  useSeoMeta({
    title: ADMIN_BUGS_PAGE_TITLE,
  });

  const currentPage = ref(1);
  const statusFilter = ref('ALL');
  const platformFilter = ref('ALL');
  const itemsPerPage = 20;

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

  // Сброс страницы на 1 при изменении фильтров
  watch([statusFilter, platformFilter], () => {
    currentPage.value = 1;
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
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="ADMIN_BUGS_PAGE_TITLE"
    back-to="/admin"
  >
    <div class="space-y-6">
      <!-- Блок фильтров -->
      <UCard variant="subtle">
        <div
          class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <p class="text-sm text-secondary">
            {{ ADMIN_BUGS_PAGE_DESCRIPTION }}
          </p>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <!-- Фильтр по статусу -->
            <USelectMenu
              v-model="statusFilter"
              :items="statusOptions"
              value-key="value"
              label-key="label"
              class="w-full sm:w-48"
            />

            <!-- Фильтр по платформе -->
            <USelectMenu
              v-model="platformFilter"
              :items="platformOptions"
              value-key="value"
              label-key="label"
              class="w-full sm:w-48"
            />
          </div>
        </div>
      </UCard>

      <!-- Состояние загрузки скелетонов -->
      <div
        v-if="isBugsLoading"
        class="space-y-4"
      >
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-48 w-full rounded-xl"
        />
      </div>

      <!-- Состояние ошибки -->
      <div
        v-else-if="hasBugsError"
        class="py-8 text-center text-error"
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

      <!-- Список багов -->
      <div
        v-else-if="resolvedBugsList.length > 0"
        class="space-y-4"
      >
        <AdminBugReportCard
          v-for="bugReport in resolvedBugsList"
          :key="bugReport.id"
          :bug-report="bugReport"
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

      <!-- Пустой список -->
      <div
        v-else
        class="py-8 text-center text-secondary"
      >
        {{ ADMIN_BUGS_EMPTY_TEXT }}
      </div>
    </div>
  </NuxtLayout>
</template>
