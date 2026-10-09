import type { MaybeRefOrGetter } from 'vue';

import type { SheetPresenceUser } from '../model';

import { toValue } from 'vue';

import {
  leaveSheetPresence,
  sendSheetPresence,
  SHEET_PRESENCE_INTERVAL_MS,
  SHEET_PRESENCE_SHARED_INTERVAL_MS,
} from '../model';
import { useCharacterSheetRemoteVersion } from './useCharacterSheetAutosave';

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
 * Совместная правка открытого листа: пока лист открыт на правку, он
 * отмечается на сервере и узнаёт, у кого ещё он открыт и какая версия листа
 * сейчас на сервере. Версию подхватывает автосохранение — обогнала свою,
 * значит лист сохранил кто-то ещё, и его правки сливаются со своими.
 *
 * Пока лист открыт у кого-то ещё, отметка идёт чаще: чужие правки появляются
 * почти сразу. Один на листе — редко, только чтобы заметить второго.
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

  const remoteVersion = useCharacterSheetRemoteVersion();

  const interval = computed(() =>
    otherUsers.value.length
      ? SHEET_PRESENCE_SHARED_INTERVAL_MS
      : SHEET_PRESENCE_INTERVAL_MS,
  );

  /** Отмечается сам и обновляет список остальных и версию листа. */
  async function heartbeat(): Promise<void> {
    const requestedSheetId = toValue(sheetId);

    if (!requestedSheetId) {
      return;
    }

    try {
      const presence = await sendSheetPresence(requestedSheetId);

      // Пока шёл запрос, могли открыть другой лист — чужой ответ не применяем.
      if (toValue(sheetId) !== requestedSheetId) {
        return;
      }

      otherUsers.value = presence.users;

      if (presence.version !== null) {
        remoteVersion.value = {
          sheetId: requestedSheetId,
          version: presence.version,
        };
      }
    } catch {
      // Отметка необязательна: следующая попытка будет по таймеру.
    }
  }

  if (import.meta.server) {
    return { otherUsers };
  }

  useIntervalFn(() => {
    void heartbeat();
  }, interval);

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
