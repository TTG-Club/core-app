import type { MaybeRefOrGetter } from 'vue';

import type { SheetPresenceUser } from '../model';

import { StatusCodes } from 'http-status-codes';
import { toValue } from 'vue';

import { getFetchStatus } from '~initiative/model';

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
 * почти сразу. Один на листе — редко, только чтобы заметить второго. Редактор
 * чужого листа отмечается часто всегда: так он сразу узнаёт, что право отозвали.
 *
 * Побочные эффекты: отметка сразу и затем по таймеру; при смене листа и при
 * уходе хозяина отметка снимается запросом, переживающим закрытие страницы.
 *
 * @param sheetId идентификатор открытого листа; пустая строка — отмечать нечего
 *   (лист не загружен или открыт только на просмотр).
 * @param isEditor лист чужой и открыт по праву редактора.
 * @returns другие пользователи, у которых лист сейчас открыт, и признак, что
 *   править лист больше нельзя (сервер отказал в отметке).
 */
export function useCharacterSheetPresence(
  sheetId: MaybeRefOrGetter<string>,
  isEditor: MaybeRefOrGetter<boolean> = false,
) {
  const otherUsers = ref<SheetPresenceUser[]>([]);

  const isAccessLost = ref(false);

  const remoteVersion = useCharacterSheetRemoteVersion();

  const interval = computed(() =>
    otherUsers.value.length || toValue(isEditor)
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
    } catch (error) {
      const status = getFetchStatus(error);

      // Отказ по самому листу — права на правки больше нет (отозвали) или
      // лист удалён. Прочие сбои не страшны: следующая попытка по таймеру.
      if (
        toValue(sheetId) === requestedSheetId
        && (status === StatusCodes.FORBIDDEN
          || status === StatusCodes.NOT_FOUND)
      ) {
        isAccessLost.value = true;
      }
    }
  }

  if (import.meta.server) {
    return { otherUsers, isAccessLost };
  }

  useIntervalFn(() => {
    void heartbeat();
  }, interval);

  watch(
    () => toValue(sheetId),
    (currentSheetId, previousSheetId) => {
      otherUsers.value = [];
      isAccessLost.value = false;

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

  return { otherUsers, isAccessLost };
}
