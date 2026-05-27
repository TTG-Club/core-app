<script setup lang="ts">
  import type {
    BugReportResponse,
    BugReportStatus,
    ParsedSelection,
  } from '../../model';

  import {
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
    getAdminBugStatusApiUrl,
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
      },
    ];
  }>();

  const requestFetch = useRequestFetch();
  const toast = useToast();
  const { copy } = useCopyAndShare();

  const isImageModalOpen = ref(false);
  const isUpdating = ref(false);

  /**
   * Текущий статус баг-репорта (для селекта).
   */
  const currentStatus = ref<BugReportStatus>(props.bugReport.status);

  /**
   * Опции для выбора статуса в селекте.
   */
  const statusOptions = Object.entries(BUG_REPORT_STATUS_LABELS).map(
    ([key, value]) => ({
      label: value,
      value: key,
    }),
  );

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
   * Обработчик автоматического сохранения нового статуса на сервере.
   *
   * @param newStatus Новый статус баг-репорта.
   */
  async function handleStatusChange(newStatus: BugReportStatus): Promise<void> {
    if (isUpdating.value) {
      return;
    }

    isUpdating.value = true;

    try {
      const statusUpdatedAt = new Date().toISOString();

      await requestFetch(getAdminBugStatusApiUrl(props.bugReport.id), {
        method: 'PATCH',
        body: { status: newStatus },
      });

      emit('update-status', {
        id: props.bugReport.id,
        status: newStatus,
        statusUpdatedAt,
      });

      toast.add({
        title: 'Статус обновлен',
        description: `Новый статус: ${BUG_REPORT_STATUS_LABELS[newStatus]}`,
        color: 'success',
      });
    } catch {
      // Откатываем локальный селект при ошибке
      currentStatus.value = props.bugReport.status;

      toast.add({
        title: 'Ошибка обновления статуса',
        description: 'Не удалось обновить статус баг-репорта на сервере',
        color: 'error',
      });
    } finally {
      isUpdating.value = false;
    }
  }

  // Следим за изменением currentStatus, чтобы отправить запрос
  watch(currentStatus, (newVal) => {
    if (newVal !== props.bugReport.status) {
      handleStatusChange(newVal);
    }
  });

  // Синхронизируем currentStatus, если bugReport поменялся в родителе
  watch(
    () => props.bugReport.status,
    (newVal) => {
      currentStatus.value = newVal;
    },
  );
</script>

<template>
  <div class="space-y-6">
    <!-- Метаданные баг-репорта -->
    <div
      class="grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-default bg-default/10 p-4 sm:grid-cols-2"
    >
      <!-- ID -->
      <div class="flex flex-col gap-1">
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
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Платформа
        </span>

        <div>
          <UBadge
            color="neutral"
            variant="subtle"
            size="md"
          >
            {{
              BUG_REPORT_PLATFORM_LABELS[bugReport.sourcePlatform]
              || bugReport.sourcePlatform
            }}
          </UBadge>
        </div>
      </div>

      <!-- Автор -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Автор
        </span>

        <span class="text-sm text-highlighted">
          {{ bugReport.userLogin || 'Аноним' }}
        </span>
      </div>

      <!-- Статус -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Статус
        </span>

        <USelectMenu
          v-model="currentStatus"
          :items="statusOptions"
          value-key="value"
          label-key="label"
          :disabled="isUpdating"
          size="sm"
          class="w-40"
        />
      </div>

      <!-- Сессия -->
      <div
        v-if="bugReport.sessionId"
        class="flex flex-col gap-1 sm:col-span-2"
      >
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Сессия
        </span>

        <span class="font-mono text-sm break-all text-highlighted select-all">
          {{ bugReport.sessionId }}
        </span>
      </div>
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
      :title="`Скриншот баг-репорта от ${bugReport.userLogin || 'Анонима'}`"
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
