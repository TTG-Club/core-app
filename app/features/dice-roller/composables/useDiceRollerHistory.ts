import { cloneDeep } from 'es-toolkit';
import { createStore, get, set } from 'idb-keyval';
import { DICE_HISTORY_STORAGE_KEY } from '~dice-roller/const';

import type { Ref } from 'vue';
import type { HistoryEntry } from '~dice-roller/types';

interface UseDiceRollerHistoryOptions {
  history: Ref<HistoryEntry[]>;
  historyScrollElement: Ref<HTMLElement | null>;
  isModalOpen: Ref<boolean>;
}

const diceRollerStore = createStore('ttg-club', 'dice-roller');

async function getStorageValue<T>(key: string): Promise<T | undefined> {
  return await get<T>(key, diceRollerStore);
}

async function setStorageValue<T>(key: string, value: T): Promise<void> {
  await set(key, cloneDeep(value), diceRollerStore);
}

/**
 * Composable для управления историей бросков.
 * Отвечает за загрузку, сохранение и очистку истории в IndexedDB (через idb-keyval).
 * Также управляет скроллом списка истории при добавлении новых записей.
 *
 * @param options - Настройки для управления историей
 * @param options.history - Ref на массив записей истории
 * @param options.historyScrollElement - Ref на DOM-элемент контейнера скролла
 * @param options.isModalOpen - Ref на состояние открытия модального окна
 */
export function useDiceRollerHistory(options: UseDiceRollerHistoryOptions) {
  const { history, historyScrollElement, isModalOpen } = options;

  const scrollToBottom = () => {
    const element = historyScrollElement.value;

    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  };

  const loadHistory = async () => {
    const savedHistory = await getStorageValue<HistoryEntry[]>(
      DICE_HISTORY_STORAGE_KEY,
    );

    if (Array.isArray(savedHistory)) {
      history.value = savedHistory;
    }
  };

  const persistHistory = async () => {
    const historySnapshot = history.value.map((entry) => ({ ...entry }));

    await setStorageValue(DICE_HISTORY_STORAGE_KEY, historySnapshot);
  };

  const clearHistory = async () => {
    history.value = [];
    await persistHistory();
    scrollToBottom();
  };

  watch(
    () => ({
      isOpen: isModalOpen.value,
      historyLength: history.value.length,
    }),
    async (currentState, previousState) => {
      if (!currentState.isOpen) {
        return;
      }

      scrollToBottom();

      if (currentState.historyLength !== previousState.historyLength) {
        await persistHistory();
      }
    },
    { flush: 'post' },
  );

  return {
    loadHistory,
    clearHistory,
    scrollToBottom,
  };
}
