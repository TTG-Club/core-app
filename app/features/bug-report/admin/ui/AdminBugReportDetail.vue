<script setup lang="ts">
  import type {
    BugReportResponse,
    BugReportStatus,
    ParsedSelection,
  } from '../../model';

  import {
    BUG_REPORT_ANONYMOUS_USER,
    BUG_REPORT_ANONYMOUS_USER_GENITIVE,
    BUG_REPORT_COMMENT_SAVE_BUTTON_LABEL,
    BUG_REPORT_COMMENT_SAVE_SUCCESS_DESC,
    BUG_REPORT_COMMENT_SAVE_SUCCESS_TITLE,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_COMMENT_MAX_LENGTH,
    BUG_REPORT_STATUS_COMMENT_PLACEHOLDER,
    BUG_REPORT_STATUS_LABELS,
    BUG_REPORT_STATUS_ORDER,
    BUG_REPORT_STATUS_UPDATE_ERROR_DESC,
    BUG_REPORT_STATUS_UPDATE_ERROR_TITLE,
    BUG_REPORT_STATUS_UPDATE_SUCCESS_TITLE,
    getAdminBugStatusApiUrl,
    getBugReportStatusColor,
  } from '../../model';

  /**
   * Свойства компонента детального просмотра баг-репорта.
   */
  const props = defineProps<{
    /** Данные баг-репорта */
    bugReport: BugReportResponse;
  }>();

  const emit = defineEmits<{
    /** Событие успешного обновления статуса */
    'update-status': [
      payload: {
        id: string;
        status: BugReportStatus;
        statusUpdatedAt: string;
        statusComment?: string;
      },
    ];
  }>();

  const requestFetch = useRequestFetch();
  const toast = useToast();
  const { copy } = useCopyAndShare();

  const isImageModalOpen = ref(false);
  const isUpdating = ref(false);
  const currentTargetStatus = ref<BugReportStatus | null>(null);

  /**
   * Текст комментария — инициализируется из существующего statusComment.
   */
  const statusCommentInput = ref(props.bugReport.statusComment ?? '');

  const isSavingComment = ref(false);

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
    return BUG_REPORT_STATUS_ORDER.map((status) => ({
      status,
      label: BUG_REPORT_STATUS_LABELS[status],
      color: getBugReportStatusColor(status),
    }));
  });

  /**
   * Разбирает строку выделенного текста на контекст до, выделенный фрагмент и контекст после.
   */
  const parsedSelection = computed<ParsedSelection>(() => {
    const text = props.bugReport.selectedText || '';
    const startIndex = text.indexOf('[');
    const endIndex = text.indexOf(']');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      return {
        before: text.slice(0, startIndex),
        selected: text.slice(startIndex + 1, endIndex),
        after: text.slice(endIndex + 1),
        hasSelection: true,
      };
    }

    return {
      before: '',
      selected: text,
      after: '',
      hasSelection: false,
    };
  });

  /**
   * Открывает модальное окно просмотра скриншота.
   */
  function openScreenshotModal(): void {
    isImageModalOpen.value = true;
  }

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
      const statusUpdatedAt = new Date().toISOString();

      await requestFetch(getAdminBugStatusApiUrl(props.bugReport.id), {
        method: 'PATCH',
        body: { status: targetStatus, comment },
      });

      emit('update-status', {
        id: props.bugReport.id,
        status: targetStatus,
        statusUpdatedAt,
        statusComment: comment,
      });

      statusCommentInput.value = comment ?? '';

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
      const statusUpdatedAt = new Date().toISOString();

      await requestFetch(getAdminBugStatusApiUrl(props.bugReport.id), {
        method: 'PATCH',
        body: { status: props.bugReport.status, comment },
      });

      emit('update-status', {
        id: props.bugReport.id,
        status: props.bugReport.status,
        statusUpdatedAt,
        statusComment: comment,
      });

      statusCommentInput.value = comment ?? '';

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
          title="Нажмите, чтобы скопировать ID"
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

      <UTextarea
        v-model="statusCommentInput"
        :placeholder="BUG_REPORT_STATUS_COMMENT_PLACEHOLDER"
        :maxlength="BUG_REPORT_STATUS_COMMENT_MAX_LENGTH"
        :rows="3"
        size="sm"
        :disabled="isUpdating"
      />
    </div>

    <!-- Страница ошибки -->
    <div
      v-if="bugReport.url"
      class="space-y-2"
    >
      <div class="text-xs font-medium tracking-wide text-muted uppercase">
        Страница ошибки
      </div>

      <a
        :href="bugReport.url"
        target="_blank"
        class="flex items-center gap-2 text-sm font-medium break-all text-primary hover:underline"
      >
        <span>{{ bugReport.url }}</span>

        <UIcon
          name="tabler:external-link"
          class="size-4 shrink-0"
        />
      </a>
    </div>

    <!-- Описание ошибки -->
    <div class="space-y-2">
      <div class="text-xs font-medium tracking-wide text-muted uppercase">
        Описание проблемы
      </div>

      <div
        class="rounded-xl border border-default bg-default/20 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap text-highlighted"
      >
        {{ bugReport.description }}
      </div>
    </div>

    <!-- Выделенный текст -->
    <div
      v-if="bugReport.selectedText"
      class="space-y-2"
    >
      <div class="text-xs font-medium tracking-wide text-muted uppercase">
        Выделенный текст на странице
      </div>

      <blockquote
        v-if="parsedSelection.hasSelection"
        class="rounded-r-xl border-l-4 border-primary/50 bg-default/30 py-2 pl-4 text-sm leading-relaxed break-words text-secondary"
      >
        <span class="text-secondary/70">{{ parsedSelection.before }}</span>

        <span
          class="rounded-sm bg-error/10 px-1 font-semibold text-highlighted underline decoration-error underline-offset-3"
        >
          {{ parsedSelection.selected }}
        </span>

        <span class="text-secondary/70">{{ parsedSelection.after }}</span>
      </blockquote>

      <blockquote
        v-else
        class="rounded-r-xl border-l-4 border-primary/50 bg-default/30 py-2 pl-4 text-sm leading-relaxed break-words text-secondary italic"
      >
        {{ bugReport.selectedText }}
      </blockquote>
    </div>

    <!-- Скриншот -->
    <div
      v-if="bugReport.screenshotUrl"
      class="space-y-2"
    >
      <div class="text-xs font-medium tracking-wide text-muted uppercase">
        Скриншот
      </div>

      <div
        class="relative max-w-2xl overflow-hidden rounded-xl border border-default bg-muted transition-colors hover:border-accented"
      >
        <img
          :src="bugReport.screenshotUrl"
          alt="Скриншот ошибки"
          class="max-h-[350px] w-full cursor-pointer object-contain"
          @click.left.exact.prevent="openScreenshotModal"
        />
      </div>
    </div>

    <!-- Модалка полного скриншота -->
    <UModal
      v-model:open="isImageModalOpen"
      :title="`Скриншот баг-репорта от ${bugReport.userLogin || BUG_REPORT_ANONYMOUS_USER_GENITIVE}`"
      :ui="{ content: 'max-w-5xl' }"
    >
      <template #body>
        <div
          class="flex items-center justify-center overflow-hidden rounded-lg bg-black/10 p-2"
        >
          <img
            v-if="bugReport.screenshotUrl"
            :src="bugReport.screenshotUrl"
            alt="Скриншот ошибки в оригинальном размере"
            class="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
