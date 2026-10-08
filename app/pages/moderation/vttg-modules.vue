<script setup lang="ts">
  import type { ModuleSubmission, SubmissionStatus } from '~vttg-modules/model';

  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';
  import { useVttgModulesToast } from '~vttg-modules/composables';
  import {
    APPROVED_TOAST,
    approveSubmission,
    DEFAULT_MODERATION_STATUSES,
    fetchModerationSubmissions,
    getVttgModulesErrorMessage,
    MODERATION_EMPTY_DESCRIPTION,
    MODERATION_EMPTY_TITLE,
    MODERATION_PAGE_SIZE,
    MODERATION_SKELETON_COUNT,
    MODERATION_STATUS_FILTER_PLACEHOLDER,
    MODERATION_TITLE,
    REJECTED_TOAST,
    rejectSubmission,
    RETRY_LABEL,
    SUBMISSION_STATUS_LABELS,
    SUBMISSION_STATUSES,
    VTTG_MODULES_MODERATION_ASYNC_KEY,
  } from '~vttg-modules/model';
  import {
    VttgModuleModerationCard,
    VttgModuleRejectModal,
  } from '~vttg-modules/moderation';

  useSeoMeta({ title: MODERATION_TITLE });

  const requestFetch = useRequestFetch();
  const { showError, showSuccess } = useVttgModulesToast();

  const selectedStatuses = ref<Array<SubmissionStatus>>([
    ...DEFAULT_MODERATION_STATUSES,
  ]);

  const currentPage = ref(1);
  const rejectedSubmission = ref<ModuleSubmission | null>(null);
  const isRejectOpen = ref(false);
  const isModerating = ref(false);

  const statusItems = SUBMISSION_STATUSES.map((status) => ({
    value: status,
    label: SUBMISSION_STATUS_LABELS[status],
  }));

  /**
   * Выбранные статусы в порядке жизненного цикла. Пустой выбор — все заявки:
   * так фильтр снимается одним кликом, без отдельного пункта «Все».
   */
  const statusFilter = computed<Array<SubmissionStatus>>(() =>
    SUBMISSION_STATUSES.filter((status) =>
      selectedStatuses.value.includes(status),
    ),
  );

  const {
    data: submissionsPage,
    status: submissionsStatus,
    error: submissionsError,
    refresh: refreshSubmissions,
  } = await useAsyncData(
    VTTG_MODULES_MODERATION_ASYNC_KEY,
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
  const isEmpty = computed(() => submissions.value.length === 0);

  const isPaginationVisible = computed(
    () => totalSubmissions.value > MODERATION_PAGE_SIZE,
  );

  const errorMessage = computed(() =>
    getVttgModulesErrorMessage(submissionsError.value),
  );

  // Другие статусы — другой список: со второй страницы прошлого фильтра
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
      <USelectMenu
        v-model="selectedStatuses"
        multiple
        value-key="value"
        :items="statusItems"
        :search-input="false"
        :placeholder="MODERATION_STATUS_FILTER_PLACEHOLDER"
        size="md"
        class="w-full sm:w-80"
      />

      <template v-if="isLoading">
        <USkeleton
          v-for="index in MODERATION_SKELETON_COUNT"
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
        v-else-if="isEmpty"
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
          v-if="isPaginationVisible"
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
