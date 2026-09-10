<script setup lang="ts">
  import { AdminGameReportRow } from '~find-game/admin';
  import {
    useFindGameToast,
    useParticipantNames,
  } from '~find-game/composables';
  import {
    CATALOG_RETRY_LABEL,
    deleteAllMasterGamesByReport,
    deleteGame,
    fetchGameReports,
    GAME_DELETE_CONFIRM_DESCRIPTION,
    GAME_DELETE_CONFIRM_TITLE,
    GAME_DELETE_LABEL,
    GAME_DELETED_TOAST,
    GAME_REPORT_DELETION_REASON,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_DESCRIPTION,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_LABEL,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_TITLE,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_TOAST,
    GAME_REPORTS_EMPTY_DESCRIPTION,
    GAME_REPORTS_EMPTY_TITLE,
    GAME_REPORTS_PAGE_SIZE,
    GAME_REPORTS_TITLE,
    getFindGameErrorMessage,
  } from '~find-game/model';
  import { ConfirmDialog } from '~initiative/ui-kit';
  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';

  useSeoMeta({ title: GAME_REPORTS_TITLE });

  const requestFetch = useRequestFetch();
  const { showError, showSuccess } = useFindGameToast();
  const { getParticipantName, watchParticipantNames } = useParticipantNames();
  const currentPage = ref(1);
  const selectedReportId = ref<string | null>(null);
  const isHideGameOpen = ref(false);
  const isHideAllMasterGamesOpen = ref(false);
  const isRemoving = ref(false);

  const {
    data: reportsPage,
    status: reportsStatus,
    error: reportsError,
    refresh: refreshReports,
  } = await useAsyncData(
    'moderation-game-reports',
    () =>
      fetchGameReports(
        currentPage.value - 1,
        GAME_REPORTS_PAGE_SIZE,
        requestFetch,
      ),
    { watch: [currentPage] },
  );

  const reports = computed(() => reportsPage.value?.content ?? []);
  const totalReports = computed(() => reportsPage.value?.totalElements ?? 0);
  const isLoading = computed(() => reportsStatus.value === 'pending');

  const errorMessage = computed(() =>
    getFindGameErrorMessage(reportsError.value),
  );

  const selectedReport = computed(
    () =>
      reports.value.find((report) => report.id === selectedReportId.value)
      ?? null,
  );

  watchParticipantNames(() => reports.value.map((report) => report.reporterId));

  /** Перечитывает текущую страницу очереди после ошибки. */
  function retry(): void {
    void refreshReports();
  }

  /** Открывает подтверждение скрытия одного объявления. */
  function askToHideGame(reportId: string): void {
    selectedReportId.value = reportId;
    isHideGameOpen.value = true;
  }

  /** Открывает подтверждение скрытия всех активных игр мастера. */
  function askToHideAllMasterGames(reportId: string): void {
    selectedReportId.value = reportId;
    isHideAllMasterGamesOpen.value = true;
  }

  /** Скрывает объявление, на которое пришла жалоба. */
  async function hideGame(): Promise<void> {
    if (!selectedReport.value) {
      return;
    }

    isRemoving.value = true;

    try {
      await deleteGame(
        selectedReport.value.gameId,
        GAME_REPORT_DELETION_REASON,
      );

      isHideGameOpen.value = false;
      showSuccess(GAME_DELETED_TOAST);
      await refreshReports();
    } catch (error) {
      showError(error);
    } finally {
      isRemoving.value = false;
    }
  }

  /** Скрывает все активные объявления мастера, которому принадлежит жалоба. */
  async function hideAllMasterGames(): Promise<void> {
    if (!selectedReport.value) {
      return;
    }

    isRemoving.value = true;

    try {
      await deleteAllMasterGamesByReport(selectedReport.value.gameId);
      isHideAllMasterGamesOpen.value = false;
      showSuccess(GAME_REPORT_HIDE_ALL_MASTER_GAMES_TOAST);
      await refreshReports();
    } catch (error) {
      showError(error);
    } finally {
      isRemoving.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="GAME_REPORTS_TITLE"
  >
    <div class="flex flex-col gap-3">
      <template v-if="isLoading">
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-32 w-full"
        />
      </template>

      <UiResult
        v-else-if="reportsError"
        status="error"
        :title="GAME_REPORTS_TITLE"
        :sub-title="errorMessage"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="retry">
            {{ CATALOG_RETRY_LABEL }}
          </UButton>
        </template>
      </UiResult>

      <UiResult
        v-else-if="reports.length === 0"
        status="info"
        :title="GAME_REPORTS_EMPTY_TITLE"
        :sub-title="GAME_REPORTS_EMPTY_DESCRIPTION"
      />

      <template v-else>
        <AdminGameReportRow
          v-for="report in reports"
          :key="report.id"
          :report="report"
          :reporter-name="getParticipantName(report.reporterId)"
          :busy="isRemoving"
          @hide-game="askToHideGame"
          @hide-master-games="askToHideAllMasterGames"
        />

        <UiPagination
          v-if="totalReports > GAME_REPORTS_PAGE_SIZE"
          v-model:page="currentPage"
          :total="totalReports"
          :items-per-page="GAME_REPORTS_PAGE_SIZE"
        />
      </template>

      <ConfirmDialog
        v-model:open="isHideGameOpen"
        :title="GAME_DELETE_CONFIRM_TITLE"
        :description="GAME_DELETE_CONFIRM_DESCRIPTION"
        :confirm-label="GAME_DELETE_LABEL"
        confirm-color="error"
        confirm-icon="tabler:eye-off"
        :loading="isRemoving"
        @confirm="hideGame"
      />

      <ConfirmDialog
        v-model:open="isHideAllMasterGamesOpen"
        :title="GAME_REPORT_HIDE_ALL_MASTER_GAMES_TITLE"
        :description="GAME_REPORT_HIDE_ALL_MASTER_GAMES_DESCRIPTION"
        :confirm-label="GAME_REPORT_HIDE_ALL_MASTER_GAMES_LABEL"
        confirm-color="error"
        confirm-icon="tabler:ban"
        :loading="isRemoving"
        @confirm="hideAllMasterGames"
      />
    </div>
  </NuxtLayout>
</template>
