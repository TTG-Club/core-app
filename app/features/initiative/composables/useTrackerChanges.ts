import type { TrackerDetailed } from '../model';

/** Что изменилось в бою: состояние до и после действия мастера. */
export interface TrackerChange {
  previous: TrackerDetailed | null;
  next: TrackerDetailed;
}

/**
 * Изменения боя для сторонних наблюдателей.
 *
 * Сам трекер открыт только владельцу, но за боем следят и остальные — по
 * ленте игровой комнаты. Чтобы рабочая область не знала про комнату, она
 * просто объявляет о каждом своём изменении, а кто и как их пересказывает,
 * решает подписчик.
 */
export const useTrackerChanges = createSharedComposable(() => {
  const listeners = new Set<(change: TrackerChange) => void>();

  /**
   * Подписывается на изменения боя.
   * @param listener Кому пересказывать.
   * @returns Функция отписки.
   */
  function subscribe(listener: (change: TrackerChange) => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
  }

  /**
   * Объявляет об изменении боя.
   * @param change Состояние до и после.
   */
  function publish(change: TrackerChange): void {
    listeners.forEach((listener) => listener(change));
  }

  return { publish, subscribe };
});
