import type { TrackerParticipant } from '~initiative/model';

import { HIT_POINTS_STORAGE_KEY } from '~initiative/model';

/** Текущие хиты существ по трекерам: `{ [trackerId]: { [participantId]: N } }`. */
type HitPointsStore = Record<string, Record<string, number>>;

/**
 * Текущие хиты существ трекера. На бэке поля хитов нет, поэтому значения живут
 * в localStorage устройства мастера (на другом устройстве счётчик начнётся с
 * полных хитов — приемлемо для инструмента одного ведущего).
 * Ключи — id участников (уникальны между трекерами), но бакеты разделены по
 * трекерам, чтобы чистка не задевала чужие бои.
 * @param trackerIdGetter Геттер идентификатора трекера.
 * @param participantsGetter Геттер актуального списка участников (реактивный).
 */
export function useHitPoints(
  trackerIdGetter: () => string,
  participantsGetter: () => Array<TrackerParticipant>,
) {
  const store = useLocalStorage<HitPointsStore>(HIT_POINTS_STORAGE_KEY, {});

  /** Текущие хиты участников активного трекера (нет записи — полные хиты). */
  const currentByParticipant = computed<Record<string, number>>(
    () => store.value[trackerIdGetter()] ?? {},
  );

  /**
   * Записывает текущие хиты участника (минимум 0; максимум держит контрол —
   * composable статблоков не знает).
   * @param participantId Идентификатор участника.
   * @param value Новое значение хитов.
   */
  function setHitPoints(participantId: string, value: number): void {
    const trackerId = trackerIdGetter();
    const bucket = store.value[trackerId] ?? {};

    store.value = {
      ...store.value,
      [trackerId]: { ...bucket, [participantId]: Math.max(0, value) },
    };
  }

  // Чистка записей удалённых участников. Пустой список пропускаем: во время
  // загрузки participants ещё [], и без guard-а бакет стёрся бы до прихода
  // данных (последний участник, убранный вручную, оставит запись до следующего
  // добавления — это безвредно).
  watch(
    () => participantsGetter().map((participant) => participant.id),
    (ids) => {
      if (!ids.length) {
        return;
      }

      const trackerId = trackerIdGetter();
      const bucket = store.value[trackerId];

      if (!bucket) {
        return;
      }

      const activeIds = new Set(ids);

      const prunedEntries = Object.entries(bucket).filter(([participantId]) =>
        activeIds.has(participantId),
      );

      if (prunedEntries.length !== Object.keys(bucket).length) {
        store.value = {
          ...store.value,
          [trackerId]: Object.fromEntries(prunedEntries),
        };
      }
    },
  );

  return { currentByParticipant, setHitPoints };
}
