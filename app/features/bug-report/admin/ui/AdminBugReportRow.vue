<script setup lang="ts">
  import type { BugReportResponse } from '../../model';

  import {
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
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
    (event: 'select', id: string): void;
  }>();

  const { format } = useDayjs();

  /**
   * Усеченный UUID баг-репорта (первые 8 символов).
   */
  const shortUuid = computed(() => {
    return props.bugReport.id.slice(0, 8);
  });

  /**
   * Имя автора или обозначение анонима.
   */
  const authorName = computed(() => {
    return props.bugReport.userLogin || 'Аноним';
  });

  /**
   * Форматированная дата создания.
   */
  const createdDateFormatted = computed(() => {
    return format(props.bugReport.createdAt, 'DD.MM.YY HH:mm');
  });

  /**
   * Форматированная дата последнего изменения статуса.
   */
  const updatedDateFormatted = computed(() => {
    return format(props.bugReport.statusUpdatedAt, 'DD.MM.YY HH:mm');
  });

  /**
   * Возвращает цвет бейджа в зависимости от статуса баг-репорта.
   *
   * @param status Статус баг-репорта.
   */
  function getStatusBadgeColor(
    status: 'NEW' | 'WAIT' | 'FIXED' | 'REJECTED',
  ): 'warning' | 'neutral' | 'success' | 'error' | 'info' {
    switch (status) {
      case 'NEW':
        return 'warning';
      case 'WAIT':
        return 'info';
      case 'FIXED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'neutral';
    }
  }

  /**
   * Обработчик клика по строке.
   */
  function handleClick(): void {
    emit('select', props.bugReport.id);
  }
</script>

<template>
  <div
    class="flex cursor-pointer flex-col gap-2 rounded-xl border px-4 py-3 transition-all select-none lg:flex-row lg:items-center lg:justify-between"
    :class="
      isOpened
        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/50'
        : 'border-default bg-elevated hover:border-accented hover:bg-accented'
    "
    @click.left.exact.prevent="handleClick"
  >
    <!-- Левая секция: UUID, Автор, Статус, Платформа -->
    <div class="flex min-w-0 flex-wrap items-center gap-3">
      <!-- UUID -->
      <span
        class="shrink-0 font-mono text-xs text-secondary"
        title="UUID баг-репорта"
      >
        {{ shortUuid }}
      </span>

      <!-- Автор -->
      <span
        class="max-w-[120px] truncate text-sm font-semibold text-highlighted"
        :title="authorName"
      >
        {{ authorName }}
      </span>

      <!-- Статус -->
      <UBadge
        :color="getStatusBadgeColor(bugReport.status)"
        variant="subtle"
        size="sm"
        class="shrink-0"
      >
        {{ BUG_REPORT_STATUS_LABELS[bugReport.status] || bugReport.status }}
      </UBadge>

      <!-- Платформа -->
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
        class="shrink-0"
      >
        {{
          BUG_REPORT_PLATFORM_LABELS[bugReport.sourcePlatform]
          || bugReport.sourcePlatform
        }}
      </UBadge>
    </div>

    <!-- Правая секция: Иконки медиа, Даты создания/обновления -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-4 text-xs text-secondary sm:gap-6 lg:justify-end"
    >
      <!-- Наличие скриншота и выделенного текста -->
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
      </div>

      <!-- Даты создания и изменения -->
      <div class="flex items-center gap-3">
        <span
          class="whitespace-nowrap"
          title="Дата создания"
        >
          Создан: {{ createdDateFormatted }}
        </span>

        <span class="hidden text-muted/30 sm:inline">|</span>

        <span
          class="whitespace-nowrap"
          title="Дата изменения статуса"
        >
          Изменен: {{ updatedDateFormatted }}
        </span>
      </div>
    </div>
  </div>
</template>
