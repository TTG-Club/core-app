import { liveQuery } from 'dexie';

import { db } from '../model/db';

import type { Ref } from 'vue';

import type { HistoryEntry } from '../types';

interface UseDiceRollerHistoryOptions {
  history: Ref<HistoryEntry[]>;
  historyScrollElement: Ref<HTMLElement | null>;
  isModalOpen: Ref<boolean>;
}

/**
 * Composable для управления историей бросков.
 * Отвечает за загрузку, сохранение и очистку истории в IndexedDB (через Dexie).
 * Также управляет скроллом списка истории при добавлении новых записей.
 *
 * @param options - Настройки для управления историей
 * @param options.history - Ref на массив записей истории
 * @param options.historyScrollElement - Ref на DOM-элемент контейнера скролла
 * @param options.isModalOpen - Ref на состояние открытия модального окна
 */
export function useDiceRollerHistory(options: UseDiceRollerHistoryOptions) {
  const { history, historyScrollElement, isModalOpen } = options;

  let isSyncing = false;

  const scrollToBottom = () => {
    const element = historyScrollElement.value;

    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  };

  // Синхронизация из IDB в history (при загрузке или изменении в другой вкладке)
  if (import.meta.client) {
    liveQuery(() => db.history.orderBy('timestamp').toArray()).subscribe(
      (data) => {
        isSyncing = true;
        history.value = data;

        nextTick(() => {
          isSyncing = false;
        });
      },
    );
  }

  // Синхронизация из history в IDB (при добавлении броска)
  watch(
    history,
    async (newHistory) => {
      if (isSyncing) {
        return;
      }

      await db.transaction('rw', db.history, async () => {
        await db.history.clear();
        await db.history.bulkPut(JSON.parse(JSON.stringify(newHistory)));
      });
    },
    { deep: true },
  );

  const clearHistory = () => {
    history.value = [];
    // Watch сработает и очистит БД
    scrollToBottom();
  };

  watch(
    () => ({
      isOpen: isModalOpen.value,
      historyLength: history.value.length,
    }),
    (currentState) => {
      if (!currentState.isOpen) {
        return;
      }

      scrollToBottom();
    },
    { flush: 'post' },
  );

  /**
   * Следим за появлением элемента скролла.
   * Если модальное окно открыто, но элемент только что появился (например, после v-if),
   * прокручиваем список вниз.
   */
  watch(historyScrollElement, (element) => {
    if (element && isModalOpen.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  });

  return {
    clearHistory,
    scrollToBottom,
  };
}
