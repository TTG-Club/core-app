<script setup lang="ts">
  import {
    useFindGameToast,
    useParticipantNames,
  } from '~find-game/composables';
  import {
    deleteAllMasterGamesByReport,
    deleteGame,
    fetchGameReports,
    GAME_REPORT_AUTHOR_LABEL,
    GAME_REPORT_CREATED_LABEL,
    GAME_REPORT_DELETION_REASON,
    GAME_REPORT_HIDDEN_BADGE,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_DESCRIPTION,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_LABEL,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_TITLE,
    GAME_REPORT_HIDE_ALL_MASTER_GAMES_TOAST,
    GAME_REPORT_HIDE_GAME_DESCRIPTION,
    GAME_REPORT_HIDE_GAME_LABEL,
    GAME_REPORT_HIDE_GAME_TITLE,
    GAME_REPORT_HIDE_GAME_TOAST,
    GAME_REPORT_REASON_LABELS,
    GAME_REPORTS_EMPTY_DESCRIPTION,
    GAME_REPORTS_EMPTY_TITLE,
    GAME_REPORTS_PAGE_SIZE,
    GAME_REPORTS_RETRY_LABEL,
    GAME_REPORTS_TITLE,
    GAMES_ROUTE,
    getFindGameErrorMessage,
  } from '~find-game/model';
  import { ConfirmDialog } from '~initiative/ui-kit';
  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';

  useSeoMeta({ title: GAME_REPORTS_TITLE });

  const requestFetch = useRequestFetch();
  const { format } = useDayjs();
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
      showSuccess(GAME_REPORT_HIDE_GAME_TOAST);
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
            {{ GAME_REPORTS_RETRY_LABEL }}
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
        <article
          v-for="report in reports"
          :key="report.id"
          class="flex flex-col gap-3 rounded-xl border border-default bg-elevated p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <NuxtLink
                :to="`${GAMES_ROUTE}/${report.gameId}`"
                class="font-semibold text-highlighted hover:text-primary"
              >
                {{ report.gameTitle }}
              </NuxtLink>

              <p class="mt-1 text-sm text-muted">
                {{ GAME_REPORT_AUTHOR_LABEL }}:
                {{ getParticipantName(report.reporterId) }}
              </p>
            </div>

            <UBadge
              color="error"
              variant="subtle"
              :label="GAME_REPORT_REASON_LABELS[report.reason]"
            />
          </div>

          <p
            v-if="report.details"
            class="text-sm whitespace-pre-line text-toned"
          >
            {{ report.details }}
          </p>

          <p class="text-xs text-muted">
            {{ GAME_REPORT_CREATED_LABEL }}:
            {{ format(report.createdAt, 'DD.MM.YYYY HH:mm') }}
          </p>

          <div class="flex flex-wrap gap-2">
            <UBadge
              v-if="report.gameDeleted"
              color="neutral"
              variant="subtle"
              :label="GAME_REPORT_HIDDEN_BADGE"
            />

            <UButton
              v-else
              size="sm"
              color="error"
              variant="soft"
              icon="tabler:eye-off"
              :disabled="isRemoving"
              :label="GAME_REPORT_HIDE_GAME_LABEL"
              @click.left.exact.prevent="askToHideGame(report.id)"
            />

            <UButton
              size="sm"
              color="error"
              variant="outline"
              icon="tabler:ban"
              :disabled="isRemoving"
              :label="GAME_REPORT_HIDE_ALL_MASTER_GAMES_LABEL"
              @click.left.exact.prevent="askToHideAllMasterGames(report.id)"
            />
          </div>
        </article>

        <UiPagination
          v-if="totalReports > GAME_REPORTS_PAGE_SIZE"
          v-model:page="currentPage"
          :total="totalReports"
          :items-per-page="GAME_REPORTS_PAGE_SIZE"
        />
      </template>

      <ConfirmDialog
        v-model:open="isHideGameOpen"
        :title="GAME_REPORT_HIDE_GAME_TITLE"
        :description="GAME_REPORT_HIDE_GAME_DESCRIPTION"
        :confirm-label="GAME_REPORT_HIDE_GAME_LABEL"
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
