<script setup lang="ts">
  import type { BugReportResponse } from '../../model';

  import {
    BUG_REPORT_ANONYMOUS_USER,
    BUG_REPORT_DATE_FORMAT,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
    getBugReportStatusColor,
  } from '../../model';

  /**
   * Свойства компонента строки списка баг-репортов.
   */
  const props = defineProps<{
    /** Данные баг-репорта */
    bugReport: BugReportResponse;
    /** Выбран ли этот баг-репорт в данный момент */
    isOpened?: boolean;
  }>();

  const emit = defineEmits<{
    /** Событие клика по строке для выбора бага */
    select: [id: string];
  }>();

  const { format } = useDayjs();

  /**
   * Усечённый UUID баг-репорта (первые 8 символов).
   */
  const shortUuid = computed(() => {
    return props.bugReport.id.slice(0, 8);
  });

  /**
   * Имя автора или обозначение анонима.
   */
  const authorName = computed(() => {
    return props.bugReport.userLogin || BUG_REPORT_ANONYMOUS_USER;
  });

  /**
   * Форматированная дата создания.
   */
  const createdDateFormatted = computed(() => {
    return format(props.bugReport.createdAt, BUG_REPORT_DATE_FORMAT);
  });

  /**
   * Обработчик клика по строке.
   */
  function handleClick(): void {
    emit('select', props.bugReport.id);
  }
</script>

<template>
  <div
    class="flex cursor-pointer flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border px-4 py-3 transition-all select-none"
    :class="
      isOpened
        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/50'
        : 'border-default bg-elevated hover:border-accented hover:bg-accented'
    "
    @click.left.exact.prevent="handleClick"
  >
    <!-- Левая секция: UUID, Статус, Платформа -->
    <div
      class="flex min-w-0 flex-1 items-center justify-between gap-4 sm:flex-initial sm:gap-8"
    >
      <!-- UUID -->
      <span
        class="shrink-0 font-mono text-xs text-secondary"
        title="UUID баг-репорта"
      >
        {{ shortUuid }}
      </span>

      <!-- Статус -->
      <div class="flex w-24 shrink-0">
        <UBadge
          :color="getBugReportStatusColor(bugReport.status)"
          variant="subtle"
          size="sm"
        >
          {{ BUG_REPORT_STATUS_LABELS[bugReport.status] }}
        </UBadge>
      </div>

      <!-- Платформа -->
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
        class="shrink-0"
      >
        {{ BUG_REPORT_PLATFORM_LABELS[bugReport.sourcePlatform] }}
      </UBadge>
    </div>

    <!-- Правая секция: Автор, Иконки медиа, Дата создания -->
    <div
      class="flex flex-1 items-center justify-between gap-4 text-xs text-secondary sm:flex-initial sm:shrink-0 sm:gap-6"
    >
      <!-- Автор -->
      <span
        class="max-w-[120px] truncate font-semibold text-highlighted"
        :title="authorName"
      >
        {{ authorName }}
      </span>

      <span class="hidden text-muted/30 sm:inline">|</span>

      <!-- Наличие скриншота, выделенного текста и комментария -->
      <div class="flex items-center gap-2">
        <!-- Скриншот -->
        <UIcon
          name="tabler:photo"
          class="size-5 transition-colors"
          :class="bugReport.screenshotUrl ? 'text-primary' : 'text-muted/30'"
          :title="bugReport.screenshotUrl ? 'Есть скриншот' : 'Нет скриншота'"
        />

        <!-- Выделенный текст -->
        <UIcon
          name="tabler:blockquote"
          class="size-5 transition-colors"
          :class="bugReport.selectedText ? 'text-primary' : 'text-muted/30'"
          :title="
            bugReport.selectedText
              ? 'Есть выделенный текст'
              : 'Нет выделенного текста'
          "
        />

        <!-- Комментарий к статусу -->
        <UIcon
          name="tabler:message"
          class="size-5 transition-colors"
          :class="bugReport.statusComment ? 'text-primary' : 'text-muted/30'"
          :title="
            bugReport.statusComment ? 'Есть комментарий' : 'Нет комментария'
          "
        />
      </div>

      <span class="hidden text-muted/30 sm:inline">|</span>

      <!-- Дата создания -->
      <span
        class="whitespace-nowrap"
        title="Дата создания"
      >
        {{ createdDateFormatted }}
      </span>
    </div>
  </div>
</template>
