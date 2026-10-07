<script setup lang="ts">
  import type { ModuleSubmission, SubmissionStatus } from '~vttg-modules/model';

  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';
  import { useVttgModulesToast } from '~vttg-modules/composables';
  import {
    APPROVED_TOAST,
    approveSubmission,
    DEFAULT_MODERATION_STATUS,
    fetchModerationSubmissions,
    getVttgModulesErrorMessage,
    MODERATION_EMPTY_DESCRIPTION,
    MODERATION_EMPTY_TITLE,
    MODERATION_PAGE_SIZE,
    MODERATION_STATUS_ALL_LABEL,
    MODERATION_STATUS_ALL_VALUE,
    MODERATION_TITLE,
    REJECTED_TOAST,
    rejectSubmission,
    RETRY_LABEL,
    SUBMISSION_STATUS_LABELS,
    SUBMISSION_STATUSES,
  } from '~vttg-modules/model';
  import {
    VttgModuleModerationCard,
    VttgModuleRejectModal,
  } from '~vttg-modules/moderation';

  useSeoMeta({ title: MODERATION_TITLE });

  const requestFetch = useRequestFetch();
  const { showError, showSuccess } = useVttgModulesToast();

  const selectedStatus = ref<string>(DEFAULT_MODERATION_STATUS);
  const currentPage = ref(1);
  const rejectedSubmission = ref<ModuleSubmission | null>(null);
  const isRejectOpen = ref(false);
  const isModerating = ref(false);

  const statusItems = [
    ...SUBMISSION_STATUSES.map((status) => ({
      value: status,
      label: SUBMISSION_STATUS_LABELS[status],
    })),
    { value: MODERATION_STATUS_ALL_VALUE, label: MODERATION_STATUS_ALL_LABEL },
  ];

  /** Статус фильтра для запроса; «Все» — без фильтра. */
  const statusFilter = computed<SubmissionStatus | null>(
    () =>
      SUBMISSION_STATUSES.find((status) => status === selectedStatus.value)
      ?? null,
  );

  const {
    data: submissionsPage,
    status: submissionsStatus,
    error: submissionsError,
    refresh: refreshSubmissions,
  } = await useAsyncData(
    'moderation-vttg-modules',
    () =>
      fetchModerationSubmissions(
        statusFilter.value,
        currentPage.value - 1,
        MODERATION_PAGE_SIZE,
        requestFetch,
      ),
    { watch: [statusFilter, currentPage] },
  );

  const submissions = computed(() => submissionsPage.value?.content ?? []);

  const totalSubmissions = computed(
    () => submissionsPage.value?.totalElements ?? 0,
  );

  const isLoading = computed(() => submissionsStatus.value === 'pending');

  const errorMessage = computed(() =>
    getVttgModulesErrorMessage(submissionsError.value),
  );

  // Другой статус — другой список: со второй страницы прошлого фильтра
  // начинать незачем.
  watch(statusFilter, () => {
    currentPage.value = 1;
  });

  /** Перечитывает очередь после ошибки. */
  function retry(): void {
    void refreshSubmissions();
  }

  /**
   * Открывает окно с причиной отклонения.
   * @param submission Заявка, которую отклоняет модератор.
   */
  function askToReject(submission: ModuleSubmission): void {
    rejectedSubmission.value = submission;
    isRejectOpen.value = true;
  }

  /**
   * Одобряет заявку — модуль появляется в каталоге VTTG.
   * @param submissionId Идентификатор заявки.
   */
  async function approve(submissionId: string): Promise<void> {
    isModerating.value = true;

    try {
      await approveSubmission(submissionId, '');
      showSuccess(APPROVED_TOAST);
      await refreshSubmissions();
    } catch (error) {
      showError(error);
    } finally {
      isModerating.value = false;
    }
  }

  /**
   * Отклоняет выбранную заявку с причиной.
   * @param comment Причина для автора.
   */
  async function reject(comment: string): Promise<void> {
    if (!rejectedSubmission.value) {
      return;
    }

    isModerating.value = true;

    try {
      await rejectSubmission(rejectedSubmission.value.id, comment);
      isRejectOpen.value = false;
      showSuccess(REJECTED_TOAST);
      await refreshSubmissions();
    } catch (error) {
      showError(error);
    } finally {
      isModerating.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="MODERATION_TITLE"
  >
    <div class="flex flex-col gap-3">
      <UTabs
        v-model="selectedStatus"
        :items="statusItems"
        :content="false"
        size="sm"
      />

      <template v-if="isLoading">
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-40 w-full"
        />
      </template>

      <UiResult
        v-else-if="submissionsError"
        status="error"
        :title="MODERATION_TITLE"
        :sub-title="errorMessage"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="retry">
            {{ RETRY_LABEL }}
          </UButton>
        </template>
      </UiResult>

      <UiResult
        v-else-if="submissions.length === 0"
        status="info"
        :title="MODERATION_EMPTY_TITLE"
        :sub-title="MODERATION_EMPTY_DESCRIPTION"
      />

      <template v-else>
        <VttgModuleModerationCard
          v-for="submission in submissions"
          :key="submission.id"
          :submission
          :busy="isModerating"
          @approve="approve"
          @reject="askToReject"
        />

        <UiPagination
          v-if="totalSubmissions > MODERATION_PAGE_SIZE"
          v-model:page="currentPage"
          :total="totalSubmissions"
          :items-per-page="MODERATION_PAGE_SIZE"
        />
      </template>

      <VttgModuleRejectModal
        v-model:open="isRejectOpen"
        :submission="rejectedSubmission"
        :loading="isModerating"
        @submit="reject"
      />
    </div>
  </NuxtLayout>
</template>
