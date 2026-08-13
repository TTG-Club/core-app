<script setup lang="ts">
  import type { BugReportResponse } from '../../model';

  import {
    BUG_REPORT_ANONYMOUS_USER,
    BUG_REPORT_COMMENT_ABSENT_TITLE,
    BUG_REPORT_COMMENT_PRESENT_TITLE,
    BUG_REPORT_CREATED_AT_TITLE,
    BUG_REPORT_DATE_FORMAT,
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_SCREENSHOT_ABSENT_TITLE,
    BUG_REPORT_SCREENSHOT_PRESENT_TITLE,
    BUG_REPORT_SELECTION_ABSENT_TITLE,
    BUG_REPORT_SELECTION_PRESENT_TITLE,
    BUG_REPORT_STATUS_LABELS,
    BUG_REPORT_UUID_TITLE,
    getBugReportStatusColor,
  } from '../../model';

  /** Иконка-признак строки: подсказка при наведении и цвет. */
  interface MediaIndicator {
    title: string;
    iconClass: string;
  }

  /** Цвет иконки-признака, когда данные приложены к баг-репорту. */
  const INDICATOR_PRESENT_CLASS = 'text-primary';

  /** Цвет иконки-признака, когда данных нет. */
  const INDICATOR_ABSENT_CLASS = 'text-muted/30';

  /** Оформление выбранной строки списка. */
  const OPENED_ROW_CLASS =
    'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/50';

  /** Оформление обычной строки списка. */
  const ROW_CLASS =
    'border-default bg-elevated hover:border-accented hover:bg-accented';

  /**
   * Собирает подсказку и цвет иконки-признака.
   *
   * @param isPresent Приложены ли данные к баг-репорту.
   * @param presentTitle Подсказка, когда данные есть.
   * @param absentTitle Подсказка, когда данных нет.
   */
  function buildMediaIndicator(
    isPresent: boolean,
    presentTitle: string,
    absentTitle: string,
  ): MediaIndicator {
    return {
      title: isPresent ? presentTitle : absentTitle,
      iconClass: isPresent ? INDICATOR_PRESENT_CLASS : INDICATOR_ABSENT_CLASS,
    };
  }

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

  /** Оформление строки: выбранная подсвечена рамкой и фоном. */
  const rowClass = computed(() => {
    return props.isOpened ? OPENED_ROW_CLASS : ROW_CLASS;
  });

  /** Признак наличия скриншота. */
  const screenshotIndicator = computed(() => {
    return buildMediaIndicator(
      Boolean(props.bugReport.screenshotUrl),
      BUG_REPORT_SCREENSHOT_PRESENT_TITLE,
      BUG_REPORT_SCREENSHOT_ABSENT_TITLE,
    );
  });

  /** Признак наличия выделенного текста. */
  const selectionIndicator = computed(() => {
    return buildMediaIndicator(
      Boolean(props.bugReport.selectedText),
      BUG_REPORT_SELECTION_PRESENT_TITLE,
      BUG_REPORT_SELECTION_ABSENT_TITLE,
    );
  });

  /** Признак наличия комментария к статусу. */
  const commentIndicator = computed(() => {
    return buildMediaIndicator(
      Boolean(props.bugReport.statusComment),
      BUG_REPORT_COMMENT_PRESENT_TITLE,
      BUG_REPORT_COMMENT_ABSENT_TITLE,
    );
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
    class="flex cursor-pointer flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border px-4 py-3 transition select-none"
    :class="rowClass"
    @click.left.exact.prevent="handleClick"
  >
    <!-- Левая секция: UUID, Статус, Платформа -->
    <div
      class="flex w-full min-w-0 items-center justify-between gap-4 sm:w-auto sm:flex-initial sm:gap-8"
    >
      <!-- UUID -->
      <span
        class="shrink-0 font-mono text-xs text-secondary"
        :title="BUG_REPORT_UUID_TITLE"
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
      class="flex w-full items-center justify-between gap-4 text-xs text-secondary sm:w-auto sm:flex-initial sm:shrink-0 sm:gap-6"
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
          :class="screenshotIndicator.iconClass"
          :title="screenshotIndicator.title"
        />

        <!-- Выделенный текст -->
        <UIcon
          name="tabler:blockquote"
          class="size-5 transition-colors"
          :class="selectionIndicator.iconClass"
          :title="selectionIndicator.title"
        />

        <!-- Комментарий к статусу -->
        <UIcon
          name="tabler:message"
          class="size-5 transition-colors"
          :class="commentIndicator.iconClass"
          :title="commentIndicator.title"
        />
      </div>

      <span class="hidden text-muted/30 sm:inline">|</span>

      <!-- Дата создания -->
      <span
        class="whitespace-nowrap"
        :title="BUG_REPORT_CREATED_AT_TITLE"
      >
        {{ createdDateFormatted }}
      </span>
    </div>
  </div>
</template>
