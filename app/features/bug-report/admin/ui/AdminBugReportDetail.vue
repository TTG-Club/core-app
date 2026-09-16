<script setup lang="ts">
  import type {
    BugReportDetailTab,
    BugReportResponse,
    BugReportStatus,
    BugReportStatusUpdatePayload,
  } from '../../model';

  import {
    BUG_REPORT_ANONYMOUS_USER,
    BUG_REPORT_COMMENT_SAVE_BUTTON_LABEL,
    BUG_REPORT_COMMENT_SAVE_SUCCESS_DESC,
    BUG_REPORT_COMMENT_SAVE_SUCCESS_TITLE,
    BUG_REPORT_COPY_ID_TITLE,
    BUG_REPORT_DETAIL_DATE_FORMAT,
    BUG_REPORT_DETAIL_DEFAULT_TAB,
    BUG_REPORT_DETAIL_TABS,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_COMMENT_MAX_LENGTH,
    BUG_REPORT_STATUS_COMMENT_PLACEHOLDER,
    BUG_REPORT_STATUS_COMMENT_PUBLIC_HINT,
    BUG_REPORT_STATUS_LABELS,
    BUG_REPORT_STATUS_UPDATE_ERROR_DESC,
    BUG_REPORT_STATUS_UPDATE_ERROR_TITLE,
    BUG_REPORT_STATUS_UPDATE_SUCCESS_TITLE,
    BUG_REPORT_STATUS_UPDATED_BY_LABEL,
    BUG_REPORT_STATUSES,
    getAdminBugStatusApiUrl,
    getBugReportStatusColor,
    parseBugReportDiagnostics,
  } from '../../model';
  import { AdminBugReportContent, AdminBugReportDiagnostics } from './';

  /**
   * Свойства компонента детального просмотра баг-репорта.
   */
  const props = defineProps<{
    /** Данные баг-репорта */
    bugReport: BugReportResponse;
  }>();

  const emit = defineEmits<{
    /** Событие успешного обновления статуса */
    'update-status': [payload: BugReportStatusUpdatePayload];
  }>();

  const requestFetch = useRequestFetch();
  const toast = useToast();
  const { copy } = useCopyAndShare();

  const isUpdating = ref(false);
  const currentTargetStatus = ref<BugReportStatus | null>(null);

  /**
   * Текст комментария — инициализируется из существующего statusComment.
   */
  const statusCommentInput = ref(props.bugReport.statusComment ?? '');

  const isSavingComment = ref(false);

  const activeTab = ref<BugReportDetailTab>(BUG_REPORT_DETAIL_DEFAULT_TAB);

  const { format } = useDayjs();

  /**
   * Форматированная дата последнего изменения статуса.
   */
  const statusUpdatedAtFormatted = computed<string>(() => {
    return props.bugReport.statusUpdatedAt
      ? format(props.bugReport.statusUpdatedAt, BUG_REPORT_DETAIL_DATE_FORMAT)
      : '';
  });

  /**
   * Проверяет, отличается ли текущий введённый комментарий от сохранённого на сервере.
   */
  const isCommentChanged = computed<boolean>(() => {
    const currentComment = statusCommentInput.value.trim();
    const originalComment = (props.bugReport.statusComment ?? '').trim();

    return currentComment !== originalComment;
  });

  interface StatusButtonOption {
    status: BugReportStatus;
    label: string;
    color: 'warning' | 'info' | 'success' | 'error';
  }

  const statusButtons = computed<StatusButtonOption[]>(() => {
    return BUG_REPORT_STATUSES.map((status) => ({
      status,
      label: BUG_REPORT_STATUS_LABELS[status],
      color: getBugReportStatusColor(status),
    }));
  });

  /**
   * Снимок метрик производительности на момент отправки. `null` — снимка нет:
   * репорт старый, пришёл с платформы, которая его не шлёт, либо строка
   * оказалась не тем, чем должна.
   */
  const diagnostics = computed(() =>
    parseBugReportDiagnostics(props.bugReport.diagnostics),
  );

  /**
   * Вкладки нужны только тогда, когда снимок метрик есть: репорты с сайта и
   * старые репорты из VTTG показываем сплошным блоком, как раньше.
   */
  const hasDiagnostics = computed<boolean>(() => diagnostics.value !== null);

  /**
   * Сохраняет изменения статуса и комментарий на сервере.
   *
   * @param targetStatus Целевой статус для сохранения.
   */
  async function handleStatusUpdate(
    targetStatus: BugReportStatus,
  ): Promise<void> {
    if (isUpdating.value) {
      return;
    }

    isUpdating.value = true;
    currentTargetStatus.value = targetStatus;

    const comment = statusCommentInput.value.trim() || undefined;

    try {
      const updatedBug = await requestFetch<BugReportResponse>(
        getAdminBugStatusApiUrl(props.bugReport.id),
        {
          method: 'PATCH',
          body: { status: targetStatus, comment },
        },
      );

      emit('update-status', {
        id: props.bugReport.id,
        status: updatedBug.status,
        statusUpdatedAt: updatedBug.statusUpdatedAt,
        statusUpdatedBy: updatedBug.statusUpdatedBy,
        statusComment: updatedBug.statusComment ?? undefined,
      });

      statusCommentInput.value = updatedBug.statusComment ?? '';

      toast.add({
        title: BUG_REPORT_STATUS_UPDATE_SUCCESS_TITLE,
        description: `Новый статус: ${BUG_REPORT_STATUS_LABELS[targetStatus]}`,
        color: 'success',
      });
    } catch {
      toast.add({
        title: BUG_REPORT_STATUS_UPDATE_ERROR_TITLE,
        description: BUG_REPORT_STATUS_UPDATE_ERROR_DESC,
        color: 'error',
      });
    } finally {
      isUpdating.value = false;
      currentTargetStatus.value = null;
    }
  }

  /**
   * Сохраняет только комментарий к баг-репорту, не меняя его текущий статус.
   */
  async function handleSaveComment(): Promise<void> {
    if (isUpdating.value || isSavingComment.value) {
      return;
    }

    isUpdating.value = true;
    isSavingComment.value = true;

    const comment = statusCommentInput.value.trim() || undefined;

    try {
      const updatedBug = await requestFetch<BugReportResponse>(
        getAdminBugStatusApiUrl(props.bugReport.id),
        {
          method: 'PATCH',
          body: { status: props.bugReport.status, comment },
        },
      );

      emit('update-status', {
        id: props.bugReport.id,
        status: updatedBug.status,
        statusUpdatedAt: updatedBug.statusUpdatedAt,
        statusUpdatedBy: updatedBug.statusUpdatedBy,
        statusComment: updatedBug.statusComment ?? undefined,
      });

      statusCommentInput.value = updatedBug.statusComment ?? '';

      toast.add({
        title: BUG_REPORT_COMMENT_SAVE_SUCCESS_TITLE,
        description: BUG_REPORT_COMMENT_SAVE_SUCCESS_DESC,
        color: 'success',
      });
    } catch {
      toast.add({
        title: BUG_REPORT_STATUS_UPDATE_ERROR_TITLE,
        description: BUG_REPORT_STATUS_UPDATE_ERROR_DESC,
        color: 'error',
      });
    } finally {
      isUpdating.value = false;
      isSavingComment.value = false;
    }
  }

  // Синхронизируем комментарий, если bugReport поменялся в родителе
  watch(
    () => props.bugReport.statusComment,
    (newComment) => {
      statusCommentInput.value = newComment ?? '';
    },
  );

  // Другой репорт открывается с начала: вкладка со снимком метрик у него может
  // и не быть, а от предыдущего остался бы выбор «Производительность»
  watch(
    () => props.bugReport.id,
    () => {
      activeTab.value = BUG_REPORT_DETAIL_DEFAULT_TAB;
    },
  );
</script>

<template>
  <div class="space-y-6">
    <!-- Метаданные баг-репорта -->
    <div
      class="grid grid-cols-4 gap-x-6 gap-y-4 rounded-xl border border-default bg-default/10 p-4"
    >
      <!-- ID -->
      <div class="col-span-2 flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          ID (UUID)
        </span>

        <span
          class="cursor-pointer font-mono text-sm break-all text-highlighted transition-colors select-all hover:text-primary"
          :title="BUG_REPORT_COPY_ID_TITLE"
          @click.left.exact.prevent="() => copy(bugReport.id)"
        >
          {{ bugReport.id }}
        </span>
      </div>

      <!-- Платформа -->
      <div class="col-span-1 flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Платформа
        </span>

        <div>
          <UBadge
            color="neutral"
            variant="subtle"
            size="md"
          >
            {{ BUG_REPORT_PLATFORM_LABELS[bugReport.sourcePlatform] }}
          </UBadge>
        </div>
      </div>

      <!-- Автор -->
      <div class="col-span-1 flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Автор
        </span>

        <span class="text-sm text-highlighted">
          {{ bugReport.userLogin || BUG_REPORT_ANONYMOUS_USER }}
        </span>
      </div>

      <!-- Сессия -->
      <div
        v-if="bugReport.sessionId"
        class="col-span-4 flex flex-col gap-1"
      >
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Сессия
        </span>

        <span class="font-mono text-sm break-all text-highlighted select-all">
          {{ bugReport.sessionId }}
        </span>
      </div>
    </div>

    <!-- Комментарий к статусу (ввод) -->
    <div class="space-y-2">
      <div class="flex flex-wrap gap-2 pb-1">
        <UButton
          v-for="button in statusButtons"
          :key="button.status"
          :label="button.label"
          :color="button.color"
          :variant="bugReport.status === button.status ? 'solid' : 'subtle'"
          :class="[
            'transition-all duration-150',
            bugReport.status !== button.status
              ? 'opacity-60 hover:opacity-100'
              : 'font-semibold',
          ]"
          size="sm"
          :loading="isUpdating && currentTargetStatus === button.status"
          :disabled="isUpdating"
          @click.left.exact.prevent="handleStatusUpdate(button.status)"
        />

        <!-- Разделитель -->
        <div class="mx-1 ml-auto h-6 w-px self-center bg-default" />

        <!-- Кнопка сохранения комментария -->
        <UButton
          :label="BUG_REPORT_COMMENT_SAVE_BUTTON_LABEL"
          color="neutral"
          variant="outline"
          size="sm"
          icon="tabler:device-floppy"
          :loading="isSavingComment"
          :disabled="isUpdating || !isCommentChanged"
          @click.left.exact.prevent="handleSaveComment"
        />
      </div>

      <!-- Кто и когда последним менял статус (скрыт, если статус ещё не меняли) -->
      <p
        v-if="bugReport.statusUpdatedBy"
        class="flex items-center gap-1.5 text-xs text-muted"
      >
        <UIcon
          name="tabler:user-edit"
          class="size-4 shrink-0"
        />

        <span>
          {{ BUG_REPORT_STATUS_UPDATED_BY_LABEL }}
          <span class="font-medium text-secondary">
            {{ bugReport.statusUpdatedBy }}
          </span>

          <template v-if="statusUpdatedAtFormatted">
            · {{ statusUpdatedAtFormatted }}
          </template>
        </span>
      </p>

      <UTextarea
        v-model="statusCommentInput"
        :placeholder="BUG_REPORT_STATUS_COMMENT_PLACEHOLDER"
        :maxlength="BUG_REPORT_STATUS_COMMENT_MAX_LENGTH"
        :rows="3"
        size="sm"
        :disabled="isUpdating"
      />

      <!-- Комментарий уходит автору репорта — служебным заметкам здесь не место -->
      <p class="flex items-center gap-1.5 text-xs text-warning">
        <UIcon
          name="tabler:eye"
          class="size-4 shrink-0"
          aria-hidden="true"
        />

        <span>{{ BUG_REPORT_STATUS_COMMENT_PUBLIC_HINT }}</span>
      </p>
    </div>

    <!-- Репорт и снимок метрик: вкладки, пока снимок есть -->
    <UTabs
      v-if="hasDiagnostics"
      v-model="activeTab"
      :items="BUG_REPORT_DETAIL_TABS"
      :unmount-on-hide="false"
      size="sm"
      :ui="{ root: 'gap-4', content: 'min-w-0' }"
    >
      <template #report>
        <AdminBugReportContent :bug-report="bugReport" />
      </template>

      <template #diagnostics>
        <!-- v-if повторяет проверку снаружи: внутри слота сужение типа теряется -->
        <AdminBugReportDiagnostics
          v-if="diagnostics"
          :diagnostics="diagnostics"
        />
      </template>
    </UTabs>

    <AdminBugReportContent
      v-else
      :bug-report="bugReport"
    />
  </div>
</template>
