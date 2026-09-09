import {
  BOOKMARK_PLAYER_ADDED_TOAST,
  BOOKMARK_PLAYER_REMOVED_TOAST,
  bookmarkPlayer,
  fetchBookmarkedPlayers,
  fetchFollowedMasters,
  FOLLOW_MASTER_ADDED_TOAST,
  FOLLOW_MASTER_REMOVED_TOAST,
  followMaster,
  unbookmarkPlayer,
  unfollowMaster,
} from '../model';
import { useFindGameToast } from './useFindGameToast';

/**
 * Отметки участников друг о друге.
 *
 * Оба списка нужны в разных углах сайта разом: кнопка в профиле мастера
 * должна знать, отмечен ли он, а список заявок — отмечен ли игрок. Держать их
 * в одном месте дешевле, чем спрашивать сервис на каждую кнопку.
 *
 * `createSharedComposable`, а не `createGlobalState`: списки живут, пока
 * открыта вкладка пользователя, и не должны копиться в памяти сервера между
 * запросами.
 */
export const useFollows = createSharedComposable(() => {
  const { isLoggedIn } = useUser();
  const { showError, showSuccess } = useFindGameToast();

  const {
    data: masters,
    refresh: refreshMasters,
    status: mastersStatus,
  } = useAsyncData(
    'find-game-followed-masters',
    () => (isLoggedIn.value ? fetchFollowedMasters() : Promise.resolve([])),
    { watch: [isLoggedIn], server: false, deep: false, default: () => [] },
  );

  const {
    data: players,
    refresh: refreshPlayers,
    status: playersStatus,
  } = useAsyncData(
    'find-game-bookmarked-players',
    () => (isLoggedIn.value ? fetchBookmarkedPlayers() : Promise.resolve([])),
    { watch: [isLoggedIn], server: false, deep: false, default: () => [] },
  );

  const masterIds = computed(
    () => new Set(masters.value.map((follow) => follow.userId)),
  );

  const playerIds = computed(
    () => new Set(players.value.map((follow) => follow.userId)),
  );

  const isMastersLoading = computed(
    () => mastersStatus.value !== 'success' && mastersStatus.value !== 'error',
  );

  const isPlayersLoading = computed(
    () => playersStatus.value !== 'success' && playersStatus.value !== 'error',
  );

  const busyUserId = ref<string | null>(null);

  /**
   * Выполняет отметку и обновляет список; отказ показывается уведомлением.
   * @param userId Кого отмечают.
   * @param successTitle Что сказать об успехе.
   * @param action Сам запрос к сервису.
   * @param refresh Какой список перечитать.
   */
  async function run(
    userId: string,
    successTitle: string,
    action: () => Promise<void>,
    refresh: () => Promise<void>,
  ): Promise<void> {
    busyUserId.value = userId;

    try {
      await action();
      await refresh();

      showSuccess(successTitle);
    } catch (error) {
      showError(error);
    } finally {
      busyUserId.value = null;
    }
  }

  /**
   * Ставит или снимает отметку с мастера.
   * @param masterId Идентификатор мастера.
   */
  function toggleMaster(masterId: string): Promise<void> {
    const marked = masterIds.value.has(masterId);

    return run(
      masterId,
      marked ? FOLLOW_MASTER_REMOVED_TOAST : FOLLOW_MASTER_ADDED_TOAST,
      () => (marked ? unfollowMaster(masterId) : followMaster(masterId)),
      () => refreshMasters(),
    );
  }

  /**
   * Ставит или снимает отметку с игрока.
   * @param playerId Идентификатор игрока.
   */
  function togglePlayer(playerId: string): Promise<void> {
    const marked = playerIds.value.has(playerId);

    return run(
      playerId,
      marked ? BOOKMARK_PLAYER_REMOVED_TOAST : BOOKMARK_PLAYER_ADDED_TOAST,
      () => (marked ? unbookmarkPlayer(playerId) : bookmarkPlayer(playerId)),
      () => refreshPlayers(),
    );
  }

  /**
   * Отмечен ли мастер.
   * @param masterId Идентификатор мастера.
   */
  function isMasterFollowed(masterId: string): boolean {
    return masterIds.value.has(masterId);
  }

  /**
   * Отмечен ли игрок.
   * @param playerId Идентификатор игрока.
   */
  function isPlayerBookmarked(playerId: string): boolean {
    return playerIds.value.has(playerId);
  }

  return {
    masters,
    players,
    busyUserId: readonly(busyUserId),
    isMastersLoading,
    isPlayersLoading,

    isMasterFollowed,
    isPlayerBookmarked,
    toggleMaster,
    togglePlayer,
  };
});
