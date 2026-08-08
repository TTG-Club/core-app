import type { ParticipantSheetLink } from '~initiative/model';

import { clamp } from 'es-toolkit';

import {
  fetchCharacterSheet,
  getSheetErrorMessage,
  updateCharacterSheet,
  updateSavedCharacterSheetHitPoints,
} from '~character-sheet/model';
import {
  SHEET_HIT_POINTS_SYNC_DELAY,
  SHEET_HIT_POINTS_SYNC_ERROR_TITLE,
} from '~initiative/model';

/** Хиты одного листа, ждущие записи. */
interface PendingHitPoints {
  link: ParticipantSheetLink;
  hitPoints: number;
}

/**
 * Запись хитов из боя в лист персонажа: урон и лечение, отмеченные мастером в
 * трекере, игрок видит на своём листе. Пишутся только текущие хиты — максимум
 * лист считает сам.
 *
 * Свой лист сохраняется целиком (`PUT`), поэтому документ перед записью
 * перечитывается: лист живёт своей жизнью, и снимок, снятый при добавлении в
 * бой, затёр бы всё, что игрок в нём поменял. Чужой лист правится узкой ручкой
 * сохранённой ссылки (`PATCH /saved/{id}/health`) — на большее у мастера прав
 * нет, и остального документа правка не касается. Временные хиты трекер не
 * знает и не трогает.
 *
 * Запросы дебаунсятся и идут по очереди: быстрые шаги урона меняют хиты
 * очередями, а в бою один лист правится многократно — на сервер уходит
 * последнее значение.
 */
export function useSheetHitPointsSync() {
  const toast = useToast();

  /** Хиты, ждущие записи: `sheetId → лист и его хиты`. */
  const pending = new Map<string, PendingHitPoints>();

  let isSaving = false;

  /**
   * Записывает хиты в свой лист: сохранение целиком, поэтому документ берётся
   * свежим, а число зажимается его максимумом.
   * @param sheetId Идентификатор листа персонажа.
   * @param hitPoints Текущие хиты из трекера.
   */
  async function saveOwn(sheetId: string, hitPoints: number): Promise<void> {
    const { data } = await fetchCharacterSheet(sheetId);

    await updateCharacterSheet(sheetId, {
      ...data,
      health: {
        ...data.health,
        current: clamp(hitPoints, 0, data.health.max),
      },
    });
  }

  /**
   * Записывает хиты одного листа. Ошибку показываем тостом: молчаливый отказ
   * означал бы, что игрок в своём листе урона не увидит и не узнает об этом.
   * @param entry Лист и его хиты из очереди.
   */
  async function save(entry: PendingHitPoints): Promise<void> {
    const { link, hitPoints } = entry;

    try {
      if (link.source === 'own') {
        await saveOwn(link.sheetId, hitPoints);

        return;
      }

      // Максимум чужого листа зажмёт сервер: документа у мастера на руках нет.
      if (link.savedId) {
        await updateSavedCharacterSheetHitPoints(link.savedId, hitPoints);
      }
    } catch (error) {
      toast.add({
        title: SHEET_HIT_POINTS_SYNC_ERROR_TITLE,
        description: getSheetErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    }
  }

  /** Записывает накопленные хиты — по одному листу за раз. */
  async function flush(): Promise<void> {
    if (isSaving) {
      return;
    }

    isSaving = true;

    try {
      // Пока идёт запись, в очередь могли лечь новые значения — цикл забирает
      // и их, поэтому последний клик не останется несохранённым.
      while (pending.size) {
        const batch = [...pending.values()];

        pending.clear();

        for (const entry of batch) {
          await save(entry);
        }
      }
    } finally {
      isSaving = false;
    }
  }

  const flushSoon = useDebounceFn(flush, SHEET_HIT_POINTS_SYNC_DELAY);

  /**
   * Ставит хиты листа в очередь записи (последнее значение вытесняет прежнее).
   * @param link Привязка участника к листу персонажа.
   * @param hitPoints Текущие хиты из трекера.
   */
  function syncHitPoints(link: ParticipantSheetLink, hitPoints: number): void {
    pending.set(link.sheetId, { link, hitPoints });

    void flushSoon();
  }

  return { syncHitPoints };
}
