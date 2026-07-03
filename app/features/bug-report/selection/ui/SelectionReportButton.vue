<script lang="ts">
  import type { TextSelection } from '../../model';

  import {
    BUG_REPORT_SELECTION_BUTTON_LABEL,
    SELECTION_CONTEXT_LENGTH,
  } from '../../model';
</script>

<script setup lang="ts">
  import { useBugReport } from '../../composables';

  /**
   * Извлекает текстовый контекст вокруг выделения из DOM.
   *
   * Обходит текстовые узлы Range, собирает полный текст родительского контейнера
   * и вычисляет смещения для before/selected/after.
   */
  function extractTextContext(selection: Selection): TextSelection | null {
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    // Получаем весь текст родительского контейнера
    const container =
      commonAncestor.nodeType === Node.TEXT_NODE
        ? commonAncestor.parentElement
        : commonAncestor;

    if (!container) {
      return null;
    }

    const fullText = container.textContent ?? '';
    const selectionStart = fullText.indexOf(selectedText);

    if (selectionStart === -1) {
      return {
        before: '',
        selected: selectedText,
        after: '',
      };
    }

    const beforeStart = Math.max(0, selectionStart - SELECTION_CONTEXT_LENGTH);

    const afterEnd = Math.min(
      fullText.length,
      selectionStart + selectedText.length + SELECTION_CONTEXT_LENGTH,
    );

    return {
      before: fullText.slice(beforeStart, selectionStart),
      selected: selectedText,
      after: fullText.slice(selectionStart + selectedText.length, afterEnd),
    };
  }

  /**
   * Находится ли выделение внутри редактируемого поля (визуальный редактор
   * {@...} с contenteditable, textarea, input). В таких местах пользователь
   * правит текст, а не читает его, поэтому кнопка «сообщить об ошибке» не нужна
   * и только мешает выделять текст для форматирования.
   */
  function isSelectionInEditableField(selection: Selection): boolean {
    const node = selection.anchorNode;

    const element = node instanceof Element ? node : node?.parentElement;

    return Boolean(
      element?.closest(
        'input, textarea, [contenteditable]:not([contenteditable="false"])',
      ),
    );
  }

  const { openReportWithSelection } = useBugReport();

  const isVisible = ref(false);
  const buttonPosition = ref({ top: 0, left: 0 });

  /**
   * Снимок контекста выделения, зафиксированный в момент показа кнопки.
   *
   * Читать `window.getSelection()` в обработчике клика ненадёжно: внутри
   * дровера (focus trap) клик по кнопке, вынесенной через Teleport в body,
   * сбрасывает выделение до срабатывания события click. Поэтому контекст
   * сохраняем заранее.
   */
  const capturedSelection = ref<TextSelection | null>(null);

  /** Позиционирует кнопку рядом с текущим выделением */
  function showButtonAtSelection() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return;
    }

    // Правка текста в редактируемом поле — не повод показывать кнопку репорта.
    if (isSelectionInEditableField(selection)) {
      isVisible.value = false;

      return;
    }

    const textContext = extractTextContext(selection);

    if (!textContext) {
      return;
    }

    capturedSelection.value = textContext;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    buttonPosition.value = {
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX + rect.width / 2,
    };

    isVisible.value = true;
  }

  /** Обработчик события отпускания мыши — показывает кнопку рядом с выделением */
  function handleMouseUp() {
    // Небольшая задержка для корректного обновления Selection API
    setTimeout(() => showButtonAtSelection(), 10);
  }

  /** Скрывает кнопку при клике или тапе вне выделения */
  function handlePointerDown(event: MouseEvent | TouchEvent) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    // Не скрываем если клик/тап по самой кнопке
    if (target.closest('[data-selection-report-button]')) {
      return;
    }

    isVisible.value = false;
  }

  /**
   * Обработчик изменения выделения текста.
   *
   * На мобильных устройствах mouseup не срабатывает при выделении,
   * поэтому используется selectionchange как универсальное событие.
   * Задержка нужна, чтобы дождаться финального состояния выделения
   * после жестов drag-to-select на тач-экранах.
   */
  const handleSelectionChange = useDebounceFn(() => {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      isVisible.value = false;

      return;
    }

    showButtonAtSelection();
  }, 300);

  /** Обрабатывает клик по кнопке: открывает модалку с заранее сохранённым контекстом */
  function handleReportClick() {
    const textContext = capturedSelection.value;

    if (textContext) {
      openReportWithSelection(textContext);
    }

    window.getSelection()?.removeAllRanges();
    capturedSelection.value = null;
    isVisible.value = false;
  }

  useEventListener('mouseup', handleMouseUp);
  useEventListener('mousedown', handlePointerDown);
  useEventListener('touchstart', handlePointerDown, { passive: true });
  useEventListener(document, 'selectionchange', handleSelectionChange);
</script>

<template>
  <Teleport to="body">
    <Transition name="selection-button">
      <button
        v-if="isVisible"
        data-selection-report-button
        class="pointer-events-auto absolute z-[9999] flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs leading-5 font-medium whitespace-nowrap text-highlighted shadow-lg transition-all duration-150 ease-in-out hover:border-accented hover:bg-accented"
        :style="{
          top: `${buttonPosition.top}px`,
          left: `${buttonPosition.left}px`,
        }"
        @pointerdown.stop
        @click.left.exact.prevent="handleReportClick"
      >
        <UIcon
          name="tabler:bug"
          class="size-4"
        />

        <span>{{ BUG_REPORT_SELECTION_BUTTON_LABEL }}</span>
      </button>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
  .selection-button-enter-active,
  .selection-button-leave-active {
    transition: all 0.15s ease;
  }

  .selection-button-enter-from,
  .selection-button-leave-to {
    transform: translateX(-50%) translateY(-4px);
    opacity: 0;
  }
</style>
