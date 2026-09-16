<script setup lang="ts">
  import type { MyBugReportChanges, MyBugReportResponse } from '../../model';

  import { useIntersectionObserver, useTimeoutFn } from '@vueuse/core';

  import { MarkupRender } from '~ui/markup';

  import {
    BUG_REPORT_PLATFORM_LABELS,
    BUG_REPORT_STATUS_LABELS,
    getBugReportDescriptionText,
    getBugReportStatusColor,
    MY_BUGS_CHANGE_COMMENT_LABEL,
    MY_BUGS_CHANGE_GENERIC_LABEL,
    MY_BUGS_CHANGE_STATUS_LABEL,
    MY_BUGS_COLLAPSE_LABEL,
    MY_BUGS_COMMENT_TITLE,
    MY_BUGS_CREATED_AT_LABEL,
    MY_BUGS_DATE_FORMAT,
    MY_BUGS_DESCRIPTION_PREVIEW_LENGTH,
    MY_BUGS_EXPAND_LABEL,
    MY_BUGS_READ_DELAY_MS,
    MY_BUGS_SCREENSHOT_ALT,
    MY_BUGS_SCREENSHOT_MODAL_TITLE,
    MY_BUGS_SCREENSHOT_TITLE,
    MY_BUGS_SELECTION_TITLE,
    MY_BUGS_STATUS_UPDATED_AT_LABEL,
    MY_BUGS_URL_TITLE,
    parseSelectedText,
    toBugReportDescriptionBlocks,
  } from '../../model';

  /** Оформление карточки с непросмотренным изменением статуса. */
  const UPDATED_CARD_CLASS =
    'border-primary/60 bg-default shadow-sm ring-1 ring-primary/25';

  /** Оформление обычной карточки. */
  const CARD_CLASS = 'border-default bg-default shadow-sm';

  const props = defineProps<{
    /** Баг-репорт текущего пользователя */
    bugReport: MyBugReportResponse;

    /** Что изменилось в репорте с прошлого просмотра */
    changes: MyBugReportChanges;
  }>();

  const emit = defineEmits<{
    /** Карточку рассмотрели — репорт можно считать прочитанным */
    read: [bugReport: MyBugReportResponse];
  }>();

  const { format } = useDayjs();

  const cardElement = useTemplateRef<HTMLElement>('cardElement');

  const isOpen = ref(false);
  const isScreenshotModalOpen = ref(false);

  const statusColor = computed(() =>
    getBugReportStatusColor(props.bugReport.status),
  );

  const statusLabel = computed(
    () => BUG_REPORT_STATUS_LABELS[props.bugReport.status],
  );

  const platformLabel = computed(
    () => BUG_REPORT_PLATFORM_LABELS[props.bugReport.sourcePlatform],
  );

  const createdAtFormatted = computed(() =>
    format(props.bugReport.createdAt, MY_BUGS_DATE_FORMAT),
  );

  const statusUpdatedAtFormatted = computed(() =>
    props.bugReport.statusUpdatedAt
      ? format(props.bugReport.statusUpdatedAt, MY_BUGS_DATE_FORMAT)
      : '',
  );

  const parsedSelection = computed(() =>
    parseSelectedText(props.bugReport.selectedText ?? ''),
  );

  /** Есть ли что показать в раскрытой части, кроме полного описания. */
  const hasDetails = computed(
    () =>
      !!props.bugReport.url
      || !!props.bugReport.selectedText
      || !!props.bugReport.screenshotUrl,
  );

  /** Абзацы описания для рендера разметки: новые репорты — с оформлением, старые — текст. */
  const descriptionBlocks = computed(() =>
    toBugReportDescriptionBlocks(props.bugReport.description),
  );

  // Порог раскрытия считаем по тексту без маркеров `{@...}`, иначе короткое, но
  // оформленное описание предлагало бы раскрыть «ничего».
  const descriptionText = computed(() =>
    getBugReportDescriptionText(props.bugReport.description),
  );

  const canExpand = computed(
    () =>
      hasDetails.value
      || descriptionText.value.length > MY_BUGS_DESCRIPTION_PREVIEW_LENGTH,
  );

  const cardClass = computed(() =>
    props.changes.isUnread ? UPDATED_CARD_CLASS : CARD_CLASS,
  );

  /**
   * Метки о том, что именно изменилось. Обе сразу — если модератор и сменил
   * статус, и оставил комментарий одним действием.
   */
  const changeLabels = computed<string[]>(() => {
    if (!props.changes.isUnread) {
      return [];
    }

    const labels: string[] = [];

    if (props.changes.hasStatusChange) {
      labels.push(MY_BUGS_CHANGE_STATUS_LABEL);
    }

    if (props.changes.hasCommentChange) {
      labels.push(MY_BUGS_CHANGE_COMMENT_LABEL);
    }

    return labels.length > 0 ? labels : [MY_BUGS_CHANGE_GENERIC_LABEL];
  });

  // Свёрнутая карточка показывает лишь начало описания: список остаётся
  // просматриваемым, даже когда в репортах длинные тексты.
  const descriptionClass = computed(() => (isOpen.value ? '' : 'line-clamp-3'));

  const toggleLabel = computed(() =>
    isOpen.value ? MY_BUGS_COLLAPSE_LABEL : MY_BUGS_EXPAND_LABEL,
  );

  const toggleIconClass = computed(() =>
    isOpen.value ? 'rotate-180 transition-transform' : 'transition-transform',
  );

  /** Открывает скриншот в полном размере. */
  function openScreenshotModal(): void {
    isScreenshotModalOpen.value = true;
  }

  // Прочитанным репорт считается, когда карточка задержалась на экране: таймер
  // запускается на входе в зону видимости и сбрасывается, если её пролистали
  // раньше срока.
  const { start: startReadTimer, stop: stopReadTimer } = useTimeoutFn(
    () => {
      emit('read', props.bugReport);
    },
    MY_BUGS_READ_DELAY_MS,
    { immediate: false },
  );

  // Наблюдаем и за нетронутыми репортами: их просмотр записывает «нулевой»
  // снимок, по которому потом видно, что именно изменил модератор.
  useIntersectionObserver(cardElement, ([entry]) => {
    if (entry?.isIntersecting) {
      startReadTimer();
    } else {
      stopReadTimer();
    }
  });
</script>

<template>
  <div
    ref="cardElement"
    class="overflow-hidden rounded-xl border transition-colors"
    :class="cardClass"
  >
    <div class="flex flex-col gap-3 p-4">
      <!-- Шапка: статус, платформа, дата создания -->
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :color="statusColor"
          variant="subtle"
          size="sm"
        >
          {{ statusLabel }}
        </UBadge>

        <UBadge
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ platformLabel }}
        </UBadge>

        <UBadge
          v-for="label in changeLabels"
          :key="label"
          color="primary"
          variant="solid"
          size="sm"
        >
          {{ label }}
        </UBadge>

        <!-- Даты неразрывны: на узком экране строка переносится по разделителю,
          а не посреди времени -->
        <span class="ml-auto text-xs text-muted tabular-nums">
          <span class="whitespace-nowrap">
            {{ MY_BUGS_CREATED_AT_LABEL }} {{ createdAtFormatted }}
          </span>

          <template v-if="statusUpdatedAtFormatted">
            ·
            <span class="whitespace-nowrap">
              {{ MY_BUGS_STATUS_UPDATED_AT_LABEL }}
              {{ statusUpdatedAtFormatted }}
            </span>
          </template>
        </span>
      </div>

      <!-- Описание проблемы. whitespace-pre-wrap сохраняет переносы строк старых
           репортов (обычный текст); у блоков разметки убираем отступ последнего -->
      <div
        class="text-sm leading-relaxed break-words whitespace-pre-wrap text-highlighted [&>*:last-child]:mb-0"
        :class="descriptionClass"
      >
        <MarkupRender :render-node="descriptionBlocks" />
      </div>

      <!-- Ответ команды: виден всегда, ради него пользователь и заходит -->
      <div
        v-if="bugReport.statusComment"
        class="rounded-r-xl border-l-4 border-primary/60 bg-elevated py-2.5 pr-3 pl-4"
      >
        <div class="flex items-center gap-1.5 text-xs font-medium text-primary">
          <UIcon
            name="tabler:message-2"
            class="size-4 shrink-0"
            aria-hidden="true"
          />

          <span>{{ MY_BUGS_COMMENT_TITLE }}</span>
        </div>

        <p
          class="mt-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-secondary"
        >
          {{ bugReport.statusComment }}
        </p>
      </div>

      <!-- Подробности репорта -->
      <UCollapsible
        v-if="canExpand"
        v-model:open="isOpen"
        :ui="{ content: 'pt-3' }"
      >
        <UButton
          :label="toggleLabel"
          color="neutral"
          variant="ghost"
          size="xs"
          trailing-icon="tabler:chevron-down"
          class="-ml-2 self-start"
          :ui="{ trailingIcon: toggleIconClass }"
        />

        <template #content>
          <div class="space-y-4">
            <!-- Страница, где найдена ошибка -->
            <div
              v-if="bugReport.url"
              class="space-y-1.5"
            >
              <div
                class="text-xs font-medium tracking-wide text-muted uppercase"
              >
                {{ MY_BUGS_URL_TITLE }}
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
                  aria-hidden="true"
                />
              </a>
            </div>

            <!-- Выделенный на странице текст -->
            <div
              v-if="bugReport.selectedText"
              class="space-y-1.5"
            >
              <div
                class="text-xs font-medium tracking-wide text-muted uppercase"
              >
                {{ MY_BUGS_SELECTION_TITLE }}
              </div>

              <blockquote
                v-if="parsedSelection.hasSelection"
                class="rounded-r-xl border-l-4 border-accented bg-elevated py-2 pl-4 text-sm leading-relaxed break-words text-secondary"
              >
                <span class="text-secondary/70">
                  {{ parsedSelection.before }}
                </span>

                <span
                  class="rounded-sm bg-error/10 px-1 font-semibold text-highlighted underline decoration-error underline-offset-3"
                >
                  {{ parsedSelection.selected }}
                </span>

                <span class="text-secondary/70">
                  {{ parsedSelection.after }}
                </span>
              </blockquote>

              <blockquote
                v-else
                class="rounded-r-xl border-l-4 border-accented bg-elevated py-2 pl-4 text-sm leading-relaxed break-words text-secondary italic"
              >
                {{ bugReport.selectedText }}
              </blockquote>
            </div>

            <!-- Скриншот -->
            <div
              v-if="bugReport.screenshotUrl"
              class="space-y-1.5"
            >
              <div
                class="text-xs font-medium tracking-wide text-muted uppercase"
              >
                {{ MY_BUGS_SCREENSHOT_TITLE }}
              </div>

              <div
                class="relative max-w-md overflow-hidden rounded-xl border border-default bg-muted transition-colors hover:border-accented"
              >
                <img
                  :src="bugReport.screenshotUrl"
                  :alt="MY_BUGS_SCREENSHOT_ALT"
                  loading="lazy"
                  class="max-h-64 w-full cursor-zoom-in object-contain"
                  @click.left.exact.prevent="openScreenshotModal"
                />
              </div>
            </div>
          </div>
        </template>
      </UCollapsible>
    </div>

    <!-- Скриншот в полном размере -->
    <UModal
      v-model:open="isScreenshotModalOpen"
      :title="MY_BUGS_SCREENSHOT_MODAL_TITLE"
      :ui="{ content: 'max-w-5xl' }"
    >
      <template #body>
        <div
          class="flex items-center justify-center overflow-hidden rounded-lg bg-black/10 p-2"
        >
          <img
            v-if="bugReport.screenshotUrl"
            :src="bugReport.screenshotUrl"
            :alt="MY_BUGS_SCREENSHOT_ALT"
            class="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
