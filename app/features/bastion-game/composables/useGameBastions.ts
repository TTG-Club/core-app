import type { MaybeRefOrGetter } from 'vue';

import type {
  CreatePlayerBastionRequest,
  PlayerBastion,
  UpdatePlayerBastionRequest,
} from '../model';

import {
  archivePlayerBastion,
  BASTION_GAME_LABELS,
  createPlayerBastion,
  fetchGameBastions,
  getBastionErrorMessage,
  updatePlayerBastion,
} from '../model';

/**
 * Бастионы игры для вкладки «Бастионы»: загрузка и действия мастера.
 * Каждое действие показывает итог уведомлением и перечитывает список.
 *
 * @param gameId Игра каталога.
 * @returns Данные вкладки и действия мастера.
 */
export function useGameBastions(gameId: MaybeRefOrGetter<string>) {
  const toast = useToast();
  const isSaving = ref(false);

  const {
    data: overview,
    status,
    error: loadError,
    refresh,
  } = useAsyncData(
    () => `game-bastions-${toValue(gameId)}`,
    () => fetchGameBastions(toValue(gameId)),
    { server: false, lazy: true },
  );

  /**
   * Выполняет действие мастера: уведомляет об успехе или об ошибке и
   * перечитывает список.
   *
   * @param action Запрос к core-api.
   * @param successTitle Текст уведомления об успехе.
   * @returns true, если действие удалось.
   */
  async function run(
    action: () => Promise<PlayerBastion>,
    successTitle: string,
  ): Promise<boolean> {
    isSaving.value = true;

    try {
      await action();
      toast.add({ title: successTitle, color: 'success' });
      await refresh();

      return true;
    } catch (error) {
      toast.add({
        title: BASTION_GAME_LABELS.saveError,
        description: getBastionErrorMessage(
          error,
          BASTION_GAME_LABELS.saveError,
        ),
        color: 'error',
      });

      return false;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    overview,
    status,
    /** Причина, по которой список не загрузился, — текстом для пользователя. */
    errorMessage: computed(() =>
      getBastionErrorMessage(loadError.value, BASTION_GAME_LABELS.loadError),
    ),
    refresh,
    isSaving,
    create: (request: CreatePlayerBastionRequest) =>
      run(() => createPlayerBastion(request), BASTION_GAME_LABELS.created),
    update: (id: string, request: UpdatePlayerBastionRequest) =>
      run(() => updatePlayerBastion(id, request), BASTION_GAME_LABELS.updated),
    archive: (id: string) =>
      run(() => archivePlayerBastion(id), BASTION_GAME_LABELS.archived),
  };
}
