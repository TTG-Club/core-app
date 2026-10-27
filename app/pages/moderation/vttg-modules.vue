<script setup lang="ts">
  import type { ModuleSubmission, SubmissionStatus } from '~vttg-modules/model';

  import { UiPagination } from '~ui/pagination';
  import { UiResult } from '~ui/result';
  import { useVttgModulesToast } from '~vttg-modules/composables';
  import {
    APPROVED_TOAST,
    approveSubmission,
    fetchModerationSubmissions,
    getVttgModulesErrorMessage,
    MODERATION_DESCRIPTION,
    MODERATION_DETAIL_EMPTY_ICON,
    MODERATION_DETAIL_EMPTY_TEXT,
    MODERATION_DETAIL_EMPTY_TITLE,
    MODERATION_EMPTY_DESCRIPTION,
    MODERATION_EMPTY_TITLE,
    MODERATION_PAGE_SIZE,
    MODERATION_SKELETON_COUNT,
    MODERATION_STATUS_FILTER_PLACEHOLDER,
    MODERATION_TITLE,
    REJECTED_TOAST,
    rejectSubmission,
    RETRY_LABEL,
    SUBMISSION_STATUS_ITEMS,
    SUBMISSION_STATUSES,
    VTTG_MODULES_MODERATION_ASYNC_KEY,
  } from '~vttg-modules/model';
  import {
    VttgModuleModerationDetailPane,
    VttgModuleModerationRow,
    VttgModuleRejectModal,
  } from '~vttg-modules/moderation';

  useSeoMeta({ title: MODERATION_TITLE });

  const { isSplitActive } = useLayoutWidth();
  const requestFetch = useRequestFetch();
  const { showError, showSuccess } = useVttgModulesToast();

  /** Выбранные в фильтре статусы; пустой выбор — все заявки. */
  const selectedStatuses = ref<Array<SubmissionStatus>>([]);

  const currentPage = ref(1);
  const selectedSubmissionId = ref<string | null>(null);
  const rejectedSubmission = ref<ModuleSubmission | null>(null);
  const isRejectOpen = ref(false);
  const isModerating = ref(false);

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

  // Заглушки нужны только пока списка ещё нет: при смене страницы, фильтра и
  // после решения прежний список остаётся на месте, и открытая карточка не
  // мигает.
  const isLoading = computed(
    () => submissionsStatus.value === 'pending' && !submissionsPage.value,
  );

  const isEmpty = computed(() => submissions.value.length === 0);

  const isPaginationVisible = computed(
    () => totalSubmissions.value > MODERATION_PAGE_SIZE,
  );

  const errorMessage = computed(() =>
    getVttgModulesErrorMessage(submissionsError.value),
  );

  /** Заявка, чья карточка открыта; ушла из списка — карточка закрывается. */
  const selectedSubmission = computed(
    () =>
      submissions.value.find(
        (submission) => submission.id === selectedSubmissionId.value,
      ) ?? null,
  );

  // В обычном режиме карточка выезжает панелью, в широком стоит справа.
  const isDrawerOpen = computed({
    get: () => !isSplitActive.value && selectedSubmission.value !== null,
    set: (open: boolean) => {
      if (!open) {
        selectedSubmissionId.value = null;
      }
    },
  });

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
   * Открывает карточку заявки.
   * @param submissionId Идентификатор заявки.
   */
  function selectSubmission(submissionId: string): void {
    selectedSubmissionId.value = submissionId;
  }

  /** Закрывает карточку заявки. */
  function closeDetail(): void {
    selectedSubmissionId.value = null;
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
  <div>
    <NuxtLayout
      name="section"
      :title="MODERATION_TITLE"
    >
      <template #controls>
        <div class="flex flex-col gap-3">
          <p class="hidden text-xs leading-normal text-secondary lg:block">
            {{ MODERATION_DESCRIPTION }}
          </p>

          <USelectMenu
            v-model="selectedStatuses"
            multiple
            value-key="value"
            :items="SUBMISSION_STATUS_ITEMS"
            :search-input="false"
            :placeholder="MODERATION_STATUS_FILTER_PLACEHOLDER"
            size="md"
            class="w-full"
          />
        </div>
      </template>

      <template #default>
        <div
          v-if="isLoading"
          class="flex flex-col gap-2"
        >
          <USkeleton
            v-for="index in MODERATION_SKELETON_COUNT"
            :key="index"
            class="h-16 w-full rounded-xl"
          />
        </div>

        <UiResult
          v-else-if="submissionsError"
          status="error"
          :title="MODERATION_TITLE"
          :sub-title="errorMessage"
        >
          <template #extra>
            <UButton
              size="md"
              @click.left.exact.prevent="retry"
            >
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

        <div
          v-else
          class="flex flex-col gap-2"
        >
          <VttgModuleModerationRow
            v-for="submission in submissions"
            :key="submission.id"
            :submission
            :is-opened="submission.id === selectedSubmissionId"
            @select="selectSubmission"
          />

          <UiPagination
            v-if="isPaginationVisible"
            v-model:page="currentPage"
            class="pt-2"
            :total="totalSubmissions"
            :items-per-page="MODERATION_PAGE_SIZE"
          />
        </div>
      </template>

      <template #detail>
        <VttgModuleModerationDetailPane
          v-if="selectedSubmission"
          :submission="selectedSubmission"
          :busy="isModerating"
          @close="closeDetail"
          @approve="approve"
          @reject="askToReject"
        />

        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
        >
          <div class="flex max-w-xs flex-col items-center gap-3">
            <UIcon
              :name="MODERATION_DETAIL_EMPTY_ICON"
              class="size-10 text-muted"
            />

            <h3 class="text-lg font-semibold text-highlighted">
              {{ MODERATION_DETAIL_EMPTY_TITLE }}
            </h3>

            <p class="text-sm text-secondary">
              {{ MODERATION_DETAIL_EMPTY_TEXT }}
            </p>
          </div>
        </div>
      </template>
    </NuxtLayout>

    <!-- Карточка заявки в обычном режиме: выезжающая панель -->
    <USlideover
      v-model:open="isDrawerOpen"
      :close="false"
      :ui="{ content: 'w-full max-w-2xl' }"
    >
      <template #content>
        <VttgModuleModerationDetailPane
          v-if="selectedSubmission"
          :submission="selectedSubmission"
          :busy="isModerating"
          @close="closeDetail"
          @approve="approve"
          @reject="askToReject"
        />
      </template>
    </USlideover>

    <VttgModuleRejectModal
      v-model:open="isRejectOpen"
      :submission="rejectedSubmission"
      :loading="isModerating"
      @submit="reject"
    />
  </div>
</template>
