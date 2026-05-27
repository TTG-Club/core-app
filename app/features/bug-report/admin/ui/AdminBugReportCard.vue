<script setup lang="ts">
  import type { BugReportResponse } from '../../model';

  import {
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
  } from '../../model';

  /**
   * Свойства компонента карточки баг-репорта.
   */
  const props = defineProps<{
    /** Данные баг-репорта */
    bugReport: BugReportResponse;
  }>();

  const { format } = useDayjs();
  const isImageModalOpen = ref(false);

  /**
   * Форматирует дату создания баг-репорта в человекочитаемый вид.
   */
  const formattedDate = computed(() => {
    return format(props.bugReport.createdAt, 'LLL');
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
  <UCard variant="subtle">
    <template #header>
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0">
          <h3 class="truncate text-base font-semibold text-highlighted">
            {{
              bugReport.userLogin
              || `Аноним (${bugReport.sessionId || 'Без сессии'})`
            }}
          </h3>

          <p class="text-xs text-secondary">
            {{ formattedDate }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <UBadge
            :color="getStatusBadgeColor(bugReport.status)"
            variant="subtle"
          >
            {{ BUG_REPORT_STATUS_LABELS[bugReport.status] || bugReport.status }}
          </UBadge>

          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{
              BUG_REPORT_PLATFORM_LABELS[bugReport.sourcePlatform]
              || bugReport.sourcePlatform
            }}
          </UBadge>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Ссылка на страницу -->
      <div
        v-if="bugReport.url"
        class="flex items-center gap-2 text-sm"
      >
        <span class="shrink-0 font-medium text-secondary">Страница:</span>

        <a
          :href="bugReport.url"
          target="_blank"
          class="flex items-center gap-1 truncate text-primary hover:underline"
        >
          <span class="truncate">{{ bugReport.url }}</span>

          <UIcon
            name="tabler:external-link"
            class="size-4 shrink-0"
          />
        </a>
      </div>

      <!-- Описание проблемы -->
      <div class="space-y-1">
        <div class="text-sm font-medium text-secondary">Описание:</div>

        <div
          class="rounded-lg border border-default bg-default/20 p-3 text-sm break-words whitespace-pre-wrap text-highlighted"
        >
          {{ bugReport.description }}
        </div>
      </div>

      <!-- Выделенный текст -->
      <div
        v-if="bugReport.selectedText"
        class="space-y-1"
      >
        <div class="text-sm font-medium text-secondary">Выделенный текст:</div>

        <blockquote
          class="rounded-r-lg border-l-4 border-primary/50 bg-default/40 py-1.5 pl-3 text-sm break-words text-secondary italic"
        >
          {{ bugReport.selectedText }}
        </blockquote>
      </div>

      <!-- Скриншот -->
      <div
        v-if="bugReport.screenshotUrl"
        class="space-y-1.5"
      >
        <div class="text-sm font-medium text-secondary">Скриншот:</div>

        <div
          class="relative max-w-xl overflow-hidden rounded-lg border border-default bg-muted transition-colors hover:border-accented"
        >
          <img
            :src="bugReport.screenshotUrl"
            alt="Скриншот ошибки"
            class="max-h-60 w-full cursor-pointer object-contain"
            @click.left.exact.prevent="openScreenshotModal"
          />
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра скриншота -->
    <UModal
      v-model:open="isImageModalOpen"
      :title="`Скриншот ошибки от ${bugReport.userLogin || 'Анонима'}`"
      :ui="{ content: 'max-w-4xl' }"
    >
      <template #body>
        <div
          class="flex items-center justify-center overflow-hidden rounded-lg bg-black/10 p-2"
        >
          <img
            v-if="bugReport.screenshotUrl"
            :src="bugReport.screenshotUrl"
            alt="Скриншот ошибки в оригинальном размере"
            class="max-h-[75vh] max-w-full object-contain"
          />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
