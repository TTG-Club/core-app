import type { MaybeRefOrGetter } from 'vue';

import type { SheetPresenceUser } from '../model';

import { toValue } from 'vue';

import {
  leaveSheetPresence,
  sendSheetPresence,
  SHEET_PRESENCE_INTERVAL_MS,
} from '../model';

/**
 * Снимает отметку присутствия. Ошибку глотает: отметка истечёт на сервере
 * сама, а уходящему со страницы показывать нечего.
 *
 * @param sheetId идентификатор листа, который закрыт.
 */
function leaveQuietly(sheetId: string): void {
  leaveSheetPresence(sheetId).catch(() => undefined);
}

/**
 * Мягкая блокировка открытого листа: пока лист открыт на правку, он
 * отмечается на сервере и узнаёт, у кого ещё он открыт, — чтобы предупредить
 * «сейчас редактирует такой-то». Ничего не запрещает: одновременное сохранение
 * и так отсекает версия листа, здесь только предупреждение заранее.
 *
 * Побочные эффекты: отметка сразу и затем по таймеру; при смене листа и при
 * уходе хозяина отметка снимается запросом, переживающим закрытие страницы.
 *
 * @param sheetId идентификатор открытого листа; пустая строка — отмечать нечего
 *   (лист не загружен или открыт только на просмотр).
 * @returns другие пользователи, у которых лист сейчас открыт.
 */
export function useCharacterSheetPresence(sheetId: MaybeRefOrGetter<string>) {
  const otherUsers = ref<SheetPresenceUser[]>([]);

  /** Отмечается сам и обновляет список остальных. */
  async function heartbeat(): Promise<void> {
    const requestedSheetId = toValue(sheetId);

    if (!requestedSheetId) {
      return;
    }

    try {
      const users = await sendSheetPresence(requestedSheetId);

      // Пока шёл запрос, могли открыть другой лист — чужой ответ не применяем.
      if (toValue(sheetId) === requestedSheetId) {
        otherUsers.value = users;
      }
    } catch {
      // Предупреждение необязательно: при ошибке его просто не показываем.
      if (toValue(sheetId) === requestedSheetId) {
        otherUsers.value = [];
      }
    }
  }

  if (import.meta.server) {
    return { otherUsers };
  }

  useIntervalFn(() => {
    void heartbeat();
  }, SHEET_PRESENCE_INTERVAL_MS);

  watch(
    () => toValue(sheetId),
    (currentSheetId, previousSheetId) => {
      otherUsers.value = [];

      if (previousSheetId) {
        leaveQuietly(previousSheetId);
      }

      if (currentSheetId) {
        void heartbeat();
      }
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    const currentSheetId = toValue(sheetId);

    if (currentSheetId) {
      leaveQuietly(currentSheetId);
    }
  });

  return { otherUsers };
}
