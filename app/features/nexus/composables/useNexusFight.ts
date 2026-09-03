import type { FightState } from '../model';

import { fetchFightState } from '../model';

/**
 * Идущий бой комнаты.
 *
 * Сам бой ведётся в разделе трекеров, куда группе входа нет: сюда он приезжает
 * снимком, который кладёт клиент мастера. Первый снимок берут запросом — он
 * нужен тому, кто вошёл в комнату посреди боя, — а дальше они приходят живой
 * подпиской.
 *
 * Состояние общее на приложение: кадры боя приходят по той же связи, что и
 * лента, поэтому раздаёт их чат, а показывает страница комнаты.
 */
export const useNexusFight = createSharedComposable(() => {
  const state = ref<FightState | null>(null);
  const roomId = ref<string | null>(null);

  /** Карусель показывают, только пока бой идёт. */
  const isActive = computed(() => !!state.value?.active);

  /**
   * Принимает снимок боя.
   * @param incoming Снимок из подписки или ответа сервиса.
   */
  function apply(incoming: FightState): void {
    state.value = incoming;
  }

  /**
   * Забывает бой прежней комнаты.
   * @param nexusId Комната, к которой переходим; `null` — комнаты нет.
   */
  function reset(nexusId: string | null): void {
    roomId.value = nexusId;
    state.value = null;
  }

  /**
   * Догружает снимок текущего боя комнаты.
   *
   * Отказ гасится молча: бой идёт у мастера, и комната без карусели остаётся
   * рабочей.
   *
   * @param nexusId Комната.
   */
  async function load(nexusId: string): Promise<void> {
    if (roomId.value !== nexusId) {
      reset(nexusId);
    }

    try {
      const loaded = await fetchFightState(nexusId);

      // За время запроса могли уйти в другую комнату: чужой бой показывать
      // нельзя.
      if (loaded && roomId.value === nexusId) {
        state.value = loaded;
      }
    } catch {
      // Комната без карусели остаётся рабочей.
    }
  }

  return { apply, isActive, load, reset, state };
});
