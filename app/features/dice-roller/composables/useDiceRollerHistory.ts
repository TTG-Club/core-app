import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { nextTick, watch } from 'vue';

import type { Ref } from 'vue';
import type { HistoryEntry } from '~dice-roller/types';

const KEY_HISTORY = 'dice-roller:history:v1';

/**
 * Композиция для управления историей бросков кубов.
 * Обеспечивает синхронизацию с IndexedDB и прокрутку списка.
 * @param opts - Параметры композиции.
 * @param opts.history - Ссылка на массив истории.
 * @param opts.historyScrollEl - Ссылка на элемент прокрутки истории.
 * @param opts.isOpen - Состояние открытия окна роллера.
 */
export function useDiceRollerHistory(opts: {
  history: Ref<HistoryEntry[]>;
  historyScrollEl: Ref<HTMLElement | null>;
  isOpen: Ref<boolean>;
}) {
  const { history, historyScrollEl, isOpen } = opts;

  // Reactively sync with IndexedDB
  const { data: savedHistory } = useIDBKeyval<HistoryEntry[]>(KEY_HISTORY, []);

  const scrollToBottom = async () => {
    await nextTick();

    const el = historyScrollEl.value;

    if (!el) {
      return;
    }

    el.scrollTop = el.scrollHeight;
  };

  const load = () => {
    // Initial sync
    if (savedHistory.value.length) {
      history.value = savedHistory.value;
    }

    // Also watch for external changes (e.g. valid load after delay)
    watch(
      savedHistory,
      (newVal) => {
        if (newVal.length) {
          history.value = newVal;
        }
      },
      { immediate: true },
    );

    // Stop watching after initial load? Or keep syncing?
    // If we keep syncing, we need to avoid loops.
    // Let's rely on the watch below for persistence and accept simple loading.
  };

  // Sync state changes to IDB
  watch(
    history,
    (newHistory) => {
      savedHistory.value = newHistory;
    },
    { deep: true },
  );

  const clear = async () => {
    history.value = [];
    await scrollToBottom();
  };

  watch(
    () => ({
      isOpen: isOpen.value,
      historyLength: history.value.length,
    }),
    async (state, _prev) => {
      if (!state.isOpen) {
        return;
      }

      await scrollToBottom();
    },
    { flush: 'post' },
  );

  return {
    load,
    clear,
    scrollToBottom,
  };
}
