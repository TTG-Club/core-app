import type { MaybeRefOrGetter } from 'vue';

import type { Reputation } from '../model';

import { fetchPlayerReputation } from '../model';

/**
 * Репутация игроков, подавших заявку в игру.
 *
 * Мастер разбирает заявки списком, и доля «сыграл бы снова» нужна ему сразу
 * по всем: без неё решение принимается вслепую. Сервис отдаёт репутацию
 * поштучно и только мастеру игры — отказ по отдельному игроку просто
 * пропускается, иначе один 403 погасил бы весь список.
 *
 * @param gameId Игра, чьи заявки разбирают; `null` — панель закрыта.
 * @param playerIds Игроки из списка заявок.
 */
export function usePlayerReputations(
  gameId: MaybeRefOrGetter<string | null>,
  playerIds: MaybeRefOrGetter<ReadonlyArray<string>>,
) {
  const currentGameId = computed(() => toValue(gameId));

  const currentPlayerIds = computed(() => [
    ...new Set(toValue(playerIds).filter(Boolean)),
  ]);

  const { data: reputations } = useAsyncData(
    () => `find-game-player-reputations-${currentGameId.value ?? 'none'}`,
    async () => {
      const id = currentGameId.value;
      const ids = currentPlayerIds.value;

      if (!id || !ids.length) {
        return {};
      }

      const loaded = await Promise.all(
        ids.map(async (playerId) => {
          try {
            return [
              playerId,
              await fetchPlayerReputation(id, playerId),
            ] as const;
          } catch {
            return null;
          }
        }),
      );

      return Object.fromEntries(loaded.filter((entry) => entry !== null));
    },
    {
      watch: [currentGameId, currentPlayerIds],
      server: false,
      deep: false,
      default: (): Record<string, Reputation> => ({}),
    },
  );

  /**
   * Репутация игрока; `null` — она ещё не загружена или сервис её не отдал.
   * @param playerId Идентификатор игрока.
   */
  function getPlayerReputation(playerId: string): Reputation | null {
    return reputations.value[playerId] ?? null;
  }

  return { reputations, getPlayerReputation };
}
