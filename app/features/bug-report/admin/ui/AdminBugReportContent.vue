<script setup lang="ts">
  import type { BugReportResponse, ParsedSelection } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import {
    BUG_REPORT_ANONYMOUS_USER_GENITIVE,
    parseSelectedText,
    toBugReportDescriptionBlocks,
  } from '../../model';

  /**
   * Содержимое самого репорта: страница, описание, выделенный фрагмент и
   * скриншот. Вынесено из детального просмотра, потому что у репортов со
   * снимком метрик это содержимое живёт во вкладке рядом с диагностикой.
   */
  const { bugReport } = defineProps<{
    /** Данные баг-репорта */
    bugReport: BugReportResponse;
  }>();

  const isImageModalOpen = ref(false);

  /** Абзацы описания для рендера разметки: новые репорты — с оформлением, старые — текст. */
  const descriptionBlocks = computed(() =>
    toBugReportDescriptionBlocks(bugReport.description),
  );

  /**
   * Разбирает строку выделенного текста на контекст до, выделенный фрагмент и контекст после.
   */
  const parsedSelection = computed<ParsedSelection>(() =>
    parseSelectedText(bugReport.selectedText ?? ''),
  );

  /**
   * Открывает модальное окно просмотра скриншота.
   */
  function openScreenshotModal(): void {
    isImageModalOpen.value = true;
  }
</script>

<template>
  <div class="space-y-6">
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

      <!-- whitespace-pre-wrap сохраняет переносы строк старых репортов (обычный
           текст); у блоков разметки убираем нижний отступ последнего -->
      <div
        class="rounded-xl border border-default bg-default/20 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap text-highlighted [&>*:last-child]:mb-0"
      >
        <MarkupRender :render-node="descriptionBlocks" />
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
