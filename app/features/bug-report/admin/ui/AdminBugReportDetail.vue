<script setup lang="ts">
  import type { BugReportResponse } from '../../model';

  import {
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
  } from '../../model';

  /**
   * Свойства компонента детального просмотра баг-репорта.
   */
  const props = defineProps<{
    /** Данные баг-репорта */
    bugReport: BugReportResponse;
  }>();

  const { format } = useDayjs();
  const isImageModalOpen = ref(false);

  /**
   * Форматированная дата создания.
   */
  const createdDateFormatted = computed(() => {
    return format(props.bugReport.createdAt, 'LLL');
  });

  /**
   * Форматированная дата последнего изменения статуса.
   */
  const updatedDateFormatted = computed(() => {
    return format(props.bugReport.statusUpdatedAt, 'LLL');
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
   * Открывает модальное окно просмотра скриншота.
   */
  function openScreenshotModal(): void {
    isImageModalOpen.value = true;
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Метаданные баг-репорта -->
    <div
      class="grid grid-cols-1 gap-4 rounded-xl border border-default bg-default/10 p-4 text-sm sm:grid-cols-2"
    >
      <div class="space-y-2">
        <div>
          <span class="mr-1 font-medium text-secondary">ID (UUID):</span>

          <span class="font-mono text-xs text-highlighted select-all">{{
            bugReport.id
          }}</span>
        </div>

        <div>
          <span class="mr-1 font-medium text-secondary">Автор:</span>

          <span class="font-semibold text-highlighted">{{
            bugReport.userLogin || 'Аноним'
          }}</span>
        </div>

        <div v-if="bugReport.sessionId">
          <span class="mr-1 font-medium text-secondary">Сессия:</span>

          <span class="font-mono text-xs text-highlighted">{{
            bugReport.sessionId
          }}</span>
        </div>
      </div>

      <div class="space-y-2">
        <div>
          <span class="mr-1 font-medium text-secondary">Статус:</span>

          <UBadge
            :color="getStatusBadgeColor(bugReport.status)"
            variant="subtle"
            size="sm"
          >
            {{ BUG_REPORT_STATUS_LABELS[bugReport.status] || bugReport.status }}
          </UBadge>
        </div>

        <div>
          <span class="mr-1 font-medium text-secondary">Платформа:</span>

          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{
              BUG_REPORT_PLATFORM_LABELS[bugReport.sourcePlatform]
              || bugReport.sourcePlatform
            }}
          </UBadge>
        </div>

        <div class="space-y-0.5 text-xs text-secondary">
          <div>Создан: {{ createdDateFormatted }}</div>

          <div>Изменен: {{ updatedDateFormatted }}</div>
        </div>
      </div>
    </div>

    <!-- Страница ошибки -->
    <div
      v-if="bugReport.url"
      class="space-y-1"
    >
      <div class="text-sm font-medium text-secondary">Страница ошибки:</div>

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
    <div class="space-y-1">
      <div class="text-sm font-medium text-secondary">Описание проблемы:</div>

      <div
        class="rounded-xl border border-default bg-default/20 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap text-highlighted"
      >
        {{ bugReport.description }}
      </div>
    </div>

    <!-- Выделенный текст -->
    <div
      v-if="bugReport.selectedText"
      class="space-y-1"
    >
      <div class="text-sm font-medium text-secondary">
        Выделенный текст на странице:
      </div>

      <blockquote
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
      <div class="text-sm font-medium text-secondary">Скриншот:</div>

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
