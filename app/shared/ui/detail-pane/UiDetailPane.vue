<script setup lang="ts">
  import type { Dayjs } from 'dayjs';
  import type { RouteLocationRaw } from 'vue-router';

  import type { SourceResponse } from '~/shared/types';

  import type { DrawerTitleName } from '../drawer/ui';
  import type { DetailPaneNeighbours } from './types';

  import { DrawerActions, DrawerBody, DrawerHeader } from '../drawer/ui';
  import {
    DETAIL_PANE_COLLAPSE_ICON,
    DETAIL_PANE_COLLAPSE_LABEL,
    DETAIL_PANE_EXPAND_ICON,
    DETAIL_PANE_EXPAND_LABEL,
    DETAIL_PANE_NEXT_ICON,
    DETAIL_PANE_NEXT_LABEL,
    DETAIL_PANE_PREVIOUS_ICON,
    DETAIL_PANE_PREVIOUS_LABEL,
  } from './constants';

  const {
    title,
    copyTitle = false,
    source = undefined,
    url = undefined,
    editUrl = undefined,
    markdown = undefined,
    dateTime = undefined,
    dateTimeFormat = undefined,
    backTo = undefined,
    noComments = false,
    neighbours = undefined,
  } = defineProps<{
    /** Заголовок панели */
    title: DrawerTitleName;
    /** Источник (книга/справочник) */
    source?: SourceResponse;
    /** Состояние загрузки */
    isLoading?: boolean;
    /** Состояние ошибки */
    isError?: boolean;
    /** Ссылка на элемент */
    url?: string;
    /** Ссылка на редактирование (для админов) */
    editUrl?: string;
    /**
     * Геттер Markdown сущности; пока сущность не загружена — `undefined`, и
     * кнопка копирования не показывается. Именно геттер, а не строка: сборка
     * разбирает всю разметку сущности и идёт по клику, а не на рендер.
     */
    markdown?: () => string;
    /** Разрешить копирование заголовка */
    copyTitle?: boolean;
    /** Дата и время */
    dateTime?: string | number | Date | Dayjs | null;
    /** Формат даты и времени */
    dateTimeFormat?: string;
    /** Путь/маршрут возврата назад */
    backTo?: RouteLocationRaw;
    /**
     * Не показывать блок комментариев под телом — для панелей, где `url`
     * указывает не на открытую сущность (например, адрес страницы
     * из баг-репорта).
     */
    noComments?: boolean;
    /**
     * Соседи записи в списке раздела: кнопки ‹ › и счётчик в шапке. Нет —
     * запись открыта не из списка, листать нечего.
     */
    neighbours?: DetailPaneNeighbours;
  }>();

  const emit = defineEmits<{
    /** Событие закрытия панели детального просмотра */
    (event: 'close'): void;
    /** Открыть соседнюю запись по её адресу */
    (event: 'navigate', url: string): void;
  }>();

  const neighbourCounter = computed(() =>
    neighbours ? `${neighbours.position} / ${neighbours.total}` : undefined,
  );

  /**
   * Открывает соседнюю запись, если она есть.
   *
   * @param url Адрес соседней записи.
   */
  function handleNeighbour(url: string | undefined): void {
    if (url) {
      emit('navigate', url);
    }
  }

  /** Открывает предыдущую запись списка. */
  function openPrevious(): void {
    handleNeighbour(neighbours?.previousUrl);
  }

  /** Открывает следующую запись списка. */
  function openNext(): void {
    handleNeighbour(neighbours?.nextUrl);
  }

  const computedTitle = computed(() =>
    typeof title === 'string' ? title : title?.rus,
  );

  const computedSubtitle = computed(() =>
    typeof title === 'string' ? undefined : title?.eng,
  );

  const { isCenteredInSplit, isDetailExpanded, toggleDetailExpanded } =
    useSectionCentered();

  const expandLabel = computed(() =>
    isDetailExpanded.value
      ? DETAIL_PANE_COLLAPSE_LABEL
      : DETAIL_PANE_EXPAND_LABEL,
  );

  const expandIcon = computed(() =>
    isDetailExpanded.value
      ? DETAIL_PANE_COLLAPSE_ICON
      : DETAIL_PANE_EXPAND_ICON,
  );

  /** Путь для блока комментариев под телом открытой сущности. */
  const commentsPath = computed(() => (noComments ? undefined : url));
</script>

<template>
  <div
    class="flex h-full w-full min-w-0 flex-col bg-transparent select-text **:select-text"
  >
    <div class="shrink-0 border-b border-default px-4 py-3 md:px-6 md:py-4">
      <DrawerHeader
        :title="computedTitle"
        :subtitle="computedSubtitle"
        :source="source"
        :date-time="dateTime"
        :date-time-format="dateTimeFormat"
        :copy-text="copyTitle"
        :back-to="backTo"
      >
        <template #actions>
          <div
            v-if="neighbours"
            class="flex items-center"
          >
            <UButton
              :icon="DETAIL_PANE_PREVIOUS_ICON"
              :title="DETAIL_PANE_PREVIOUS_LABEL"
              :aria-label="DETAIL_PANE_PREVIOUS_LABEL"
              :disabled="!neighbours.previousUrl"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              @click.left.exact.prevent="openPrevious"
            />

            <span class="px-1 text-xs text-muted tabular-nums">
              {{ neighbourCounter }}
            </span>

            <UButton
              :icon="DETAIL_PANE_NEXT_ICON"
              :title="DETAIL_PANE_NEXT_LABEL"
              :aria-label="DETAIL_PANE_NEXT_LABEL"
              :disabled="!neighbours.nextUrl"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              @click.left.exact.prevent="openNext"
            />
          </div>

          <slot name="actions" />

          <!-- Узкая раскладка: запись разворачивается на всю колонку -->
          <UButton
            v-if="isCenteredInSplit"
            :icon="expandIcon"
            :title="expandLabel"
            :aria-label="expandLabel"
            color="neutral"
            variant="ghost"
            size="sm"
            square
            @click.left.exact.prevent="toggleDetailExpanded"
          />

          <DrawerActions
            :edit-url="editUrl"
            :url="url"
            :markdown
            @close="$emit('close')"
          />
        </template>
      </DrawerHeader>
    </div>

    <div
      class="min-h-0 w-full min-w-0 flex-auto overflow-x-hidden overflow-y-auto px-4 py-4 md:px-6 md:py-6"
    >
      <DrawerBody
        :is-loading="isLoading"
        :is-error="isError"
        :comments-path="commentsPath"
      >
        <slot name="default" />
      </DrawerBody>
    </div>
  </div>
</template>
