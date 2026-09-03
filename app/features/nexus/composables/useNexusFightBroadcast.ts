import type { MaybeRefOrGetter } from 'vue';

import { v4 as createUuid } from 'uuid';

import { useTrackerChanges } from '~initiative/composables';

import {
  describeTrackerChange,
  putFightState,
  sendChatEvent,
  toFightStateDraft,
} from '../model';

/**
 * Бой мастера глазами комнаты.
 *
 * Войти в чужой трекер участник не может — бой ведёт мастер, — поэтому его
 * клиент рассказывает о бое сам: кладёт в комнату снимок для карусели ходов и
 * объявляет в ленте начало боя, чей ход и кому досталось.
 *
 * @param nexusId Комната, которой рассказываем; `null` — трекер открыт сам по
 *   себе, вне комнаты, и рассказывать некому.
 */
export function useNexusFightBroadcast(
  nexusId: MaybeRefOrGetter<string | null>,
) {
  const { subscribe } = useTrackerChanges();

  /**
   * Отправляет строку события. Молчит при отказе: не пересказанный ход —
   * досада, но прерывать из-за него бой нечем.
   *
   * @param room Комната.
   * @param text Что объявить.
   */
  async function announce(room: string, text: string): Promise<void> {
    try {
      await sendChatEvent(room, {
        clientMessageId: createUuid(),
        type: 'SYSTEM',
        text,
      });
    } catch {
      // Пересказ не дошёл: бой от этого не останавливается.
    }
  }

  onMounted(() => {
    const stop = subscribe((change) => {
      const room = toValue(nexusId);

      if (!room) {
        return;
      }

      // Снимок уходит и на первой загрузке: вошедший в комнату посреди боя
      // должен увидеть очередь ходов, а не пустоту до следующего действия
      // мастера.
      void putFightState(room, toFightStateDraft(change.next)).catch(() => {
        // Комната без карусели остаётся рабочей.
      });

      // По очереди: события боя читаются как рассказ, и порядок в ленте важнее
      // скорости отправки.
      void describeTrackerChange(change.previous, change.next).reduce(
        (queue, text) => queue.then(() => announce(room, text)),
        Promise.resolve(),
      );
    });

    onUnmounted(stop);
  });
}
