import {
  addFavoriteGame,
  fetchFavoriteGames,
  GAME_FAVORITE_ADDED_TOAST,
  GAME_FAVORITE_REMOVED_TOAST,
  removeFavoriteGame,
} from '../model';
import { useFindGameToast } from './useFindGameToast';

/**
 * Загружает идентификаторы отмеченных игр. Отметки сами по себе нужны только
 * звёздочкам, поэтому время отметки дальше не идёт — порядок задаёт сервис, а
 * карточки приходят отдельной постраничной выдачей.
 */
async function loadFavoriteGameIds(): Promise<Array<string>> {
  const favorites = await fetchFavoriteGames();

  return favorites.map((favorite) => favorite.gameId);
}

/**
 * Избранные игры пользователя.
 *
 * Список отметок живёт одним набором на всю вкладку: звёздочка стоит и в
 * каталоге, и в «Моих играх», и на самом объявлении, а спрашивать сервис о
 * каждой карточке отдельно вышло бы в запрос на строку выдачи.
 *
 * `createSharedComposable`, а не `createGlobalState`: набор принадлежит
 * открытой вкладке пользователя и не должен копиться в памяти сервера между
 * запросами.
 */
export const useFavoriteGames = createSharedComposable(() => {
  const { isLoggedIn } = useUser();
  const { showError, showSuccess } = useFindGameToast();

  const { data: gameIds, status } = useAsyncData(
    'find-game-favorite-games',
    () => (isLoggedIn.value ? loadFavoriteGameIds() : Promise.resolve([])),
    { watch: [isLoggedIn], server: false, deep: false, default: () => [] },
  );

  const favoriteIds = computed(() => new Set(gameIds.value));

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const busyGameId = ref<string | null>(null);

  /**
   * Отмечена ли игра.
   * @param gameId Идентификатор игры.
   */
  function isFavorite(gameId: string): boolean {
    return favoriteIds.value.has(gameId);
  }

  /**
   * Ставит или снимает отметку с игры.
   *
   * Набор правится ответом самого действия, без перечитывания списка: сервис
   * подтвердил ровно то, что от него просили, и второй запрос сказал бы то же
   * самое — только позже, оставив звёздочку мигать.
   *
   * @param gameId Идентификатор игры.
   */
  async function toggleFavorite(gameId: string): Promise<void> {
    const marked = isFavorite(gameId);

    busyGameId.value = gameId;

    try {
      if (marked) {
        await removeFavoriteGame(gameId);

        gameIds.value = gameIds.value.filter(
          (favoriteId) => favoriteId !== gameId,
        );
      } else {
        await addFavoriteGame(gameId);

        gameIds.value = [gameId, ...gameIds.value];
      }

      showSuccess(
        marked ? GAME_FAVORITE_REMOVED_TOAST : GAME_FAVORITE_ADDED_TOAST,
      );
    } catch (error) {
      showError(error);
    } finally {
      busyGameId.value = null;
    }
  }

  return {
    busyGameId: readonly(busyGameId),
    isLoading,

    isFavorite,
    toggleFavorite,
  };
});
