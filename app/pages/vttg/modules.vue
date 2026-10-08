<script setup lang="ts">
  import type {
    ModuleSubmission,
    SubmissionRequest,
  } from '~vttg-modules/model';

  import { Role } from '~/shared/types';
  import { ConfirmDialog } from '~initiative/ui-kit';
  import { UiResult } from '~ui/result';
  import { useVttgModulesToast } from '~vttg-modules/composables';
  import {
    createSubmission,
    fetchMySubmissions,
    getVttgModulesErrorMessage,
    REFRESHED_TOAST,
    refreshSubmissionManifest,
    resubmitSubmission,
    RESUBMITTED_TOAST,
    RETRY_LABEL,
    SUBMISSIONS_EMPTY_DESCRIPTION,
    SUBMISSIONS_EMPTY_TITLE,
    SUBMISSIONS_LOAD_ERROR_TITLE,
    SUBMISSIONS_SKELETON_COUNT,
    SUBMIT_ICON,
    SUBMIT_LABEL,
    SUBMITTED_TOAST,
    VTTG_MODULES_DESCRIPTION,
    VTTG_MODULES_MY_SUBMISSIONS_ASYNC_KEY,
    VTTG_MODULES_REQUIREMENTS,
    VTTG_MODULES_REQUIREMENTS_TITLE,
    VTTG_MODULES_TITLE,
    WITHDRAW_CONFIRM_DESCRIPTION,
    WITHDRAW_CONFIRM_TITLE,
    WITHDRAW_ICON,
    WITHDRAW_LABEL,
    WITHDRAWN_TOAST,
    withdrawSubmission,
  } from '~vttg-modules/model';
  import {
    VttgModuleSubmissionCard,
    VttgModuleSubmissionFormModal,
  } from '~vttg-modules/submissions';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  useSeoMeta({ title: VTTG_MODULES_TITLE });

  const requestFetch = useRequestFetch();
  const { showError, showSuccess } = useVttgModulesToast();

  const isFormOpen = ref(false);
  const editedSubmission = ref<ModuleSubmission | null>(null);
  const isWithdrawOpen = ref(false);
  const withdrawnSubmissionId = ref<string | null>(null);
  const isBusy = ref(false);

  const {
    data: submissions,
    status: submissionsStatus,
    error: submissionsError,
    refresh: refreshSubmissions,
  } = await useAsyncData(
    VTTG_MODULES_MY_SUBMISSIONS_ASYNC_KEY,
    () => fetchMySubmissions(requestFetch),
    { default: (): Array<ModuleSubmission> => [] },
  );

  const isLoading = computed(() => submissionsStatus.value === 'pending');
  const isEmpty = computed(() => submissions.value.length === 0);

  const errorMessage = computed(() =>
    getVttgModulesErrorMessage(submissionsError.value),
  );

  /** Перечитывает заявки после ошибки. */
  function retry(): void {
    void refreshSubmissions();
  }

  /** Открывает пустую форму новой заявки. */
  function openCreate(): void {
    editedSubmission.value = null;
    isFormOpen.value = true;
  }

  /**
   * Открывает форму правки заявки.
   * @param submission Заявка, которую правит автор.
   */
  function openEdit(submission: ModuleSubmission): void {
    editedSubmission.value = submission;
    isFormOpen.value = true;
  }

  /**
   * Открывает подтверждение отзыва заявки.
   * @param submissionId Идентификатор заявки.
   */
  function askToWithdraw(submissionId: string): void {
    withdrawnSubmissionId.value = submissionId;
    isWithdrawOpen.value = true;
  }

  /**
   * Подаёт новую заявку или отправляет исправленную. Сервис тут же читает
   * манифест, и его отказ — с причиной — показывается уведомлением.
   * @param request Данные формы.
   */
  async function saveSubmission(request: SubmissionRequest): Promise<void> {
    isBusy.value = true;

    try {
      if (editedSubmission.value) {
        await resubmitSubmission(editedSubmission.value.id, request);
        showSuccess(RESUBMITTED_TOAST);
      } else {
        await createSubmission(request);
        showSuccess(SUBMITTED_TOAST);
      }

      isFormOpen.value = false;
      await refreshSubmissions();
    } catch (error) {
      showError(error);
    } finally {
      isBusy.value = false;
    }
  }

  /**
   * Перечитывает манифест заявки.
   * @param submissionId Идентификатор заявки.
   */
  async function refreshManifest(submissionId: string): Promise<void> {
    isBusy.value = true;

    try {
      await refreshSubmissionManifest(submissionId);
      showSuccess(REFRESHED_TOAST);
      await refreshSubmissions();
    } catch (error) {
      showError(error);
    } finally {
      isBusy.value = false;
    }
  }

  /** Отзывает выбранную заявку. */
  async function withdraw(): Promise<void> {
    if (!withdrawnSubmissionId.value) {
      return;
    }

    isBusy.value = true;

    try {
      await withdrawSubmission(withdrawnSubmissionId.value);
      isWithdrawOpen.value = false;
      showSuccess(WITHDRAWN_TOAST);
      await refreshSubmissions();
    } catch (error) {
      showError(error);
    } finally {
      isBusy.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VTTG_MODULES_TITLE"
  >
    <div class="flex flex-col gap-4">
      <UCard variant="subtle">
        <div class="flex flex-col gap-3">
          <p class="text-sm text-default">
            {{ VTTG_MODULES_DESCRIPTION }}
          </p>

          <div>
            <h2 class="text-sm font-semibold text-highlighted">
              {{ VTTG_MODULES_REQUIREMENTS_TITLE }}
            </h2>

            <ul class="mt-1 list-disc pl-5 text-sm text-muted">
              <li
                v-for="requirement in VTTG_MODULES_REQUIREMENTS"
                :key="requirement"
              >
                {{ requirement }}
              </li>
            </ul>
          </div>

          <UButton
            class="self-start"
            :icon="SUBMIT_ICON"
            @click.left.exact.prevent="openCreate"
          >
            {{ SUBMIT_LABEL }}
          </UButton>
        </div>
      </UCard>

      <template v-if="isLoading">
        <USkeleton
          v-for="index in SUBMISSIONS_SKELETON_COUNT"
          :key="index"
          class="h-40 w-full"
        />
      </template>

      <UiResult
        v-else-if="submissionsError"
        status="error"
        :title="SUBMISSIONS_LOAD_ERROR_TITLE"
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
        :title="SUBMISSIONS_EMPTY_TITLE"
        :sub-title="SUBMISSIONS_EMPTY_DESCRIPTION"
      />

      <template v-else>
        <VttgModuleSubmissionCard
          v-for="submission in submissions"
          :key="submission.id"
          :submission
          :busy="isBusy"
          @edit="openEdit"
          @refresh="refreshManifest"
          @withdraw="askToWithdraw"
        />
      </template>

      <VttgModuleSubmissionFormModal
        v-model:open="isFormOpen"
        :submission="editedSubmission"
        :loading="isBusy"
        @submit="saveSubmission"
      />

      <ConfirmDialog
        v-model:open="isWithdrawOpen"
        :title="WITHDRAW_CONFIRM_TITLE"
        :description="WITHDRAW_CONFIRM_DESCRIPTION"
        :confirm-label="WITHDRAW_LABEL"
        confirm-color="error"
        :confirm-icon="WITHDRAW_ICON"
        :loading="isBusy"
        @confirm="withdraw"
      />
    </div>
  </NuxtLayout>
</template>
