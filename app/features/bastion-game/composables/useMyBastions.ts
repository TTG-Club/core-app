import type {
  CreatePlayerBastionRequest,
  UpdatePlayerBastionRequest,
} from '../model';

import {
  BASTION_GAME_LABELS,
  createPlayerBastion,
  deletePlayerBastion,
  fetchMyBastions,
  getBastionErrorMessage,
  joinGameWithBastion,
  leaveGameWithBastion,
  MY_BASTIONS_LABELS,
  updatePlayerBastion,
} from '../model';

interface UseMyBastionsOptions {
  /** Грузить список сразу; иначе — по `refresh`, например при открытии окна. */
  immediate?: boolean;
}

/**
 * Свои бастионы: список с лимитом и действия владельца. Каждое действие
 * показывает итог уведомлением и перечитывает список.
 *
 * @param options Настройки загрузки.
 * @param options.immediate Грузить список сразу.
 * @returns Список, лимит и действия.
 */
export function useMyBastions({ immediate = true }: UseMyBastionsOptions = {}) {
  const toast = useToast();
  const isSaving = ref(false);

  const {
    data: overview,
    status,
    error: loadError,
    refresh,
  } = useAsyncData('my-player-bastions', fetchMyBastions, {
    server: false,
    lazy: true,
    immediate,
  });

  const bastions = computed(() => overview.value?.bastions ?? []);

  /** Чужие бастионы, которые владельцы разрешили править по ссылке. */
  const sharedBastions = computed(() => overview.value?.shared ?? []);
  const limit = computed(() => overview.value?.limit ?? 0);
  const subscriberLimit = computed(() => overview.value?.subscriberLimit ?? 0);
  const canCreate = computed(() => bastions.value.length < limit.value);

  /** Бастионы, которые можно добавить в игру: свои, вне игры и не в архиве. */
  const freeBastions = computed(() =>
    bastions.value.filter(
      (bastion) => !bastion.gameId && bastion.status !== 'ARCHIVED',
    ),
  );

  /**
   * Выполняет действие: уведомляет об успехе или об ошибке и перечитывает
   * список.
   *
   * @param action Запрос к core-api.
   * @param successTitle Текст уведомления об успехе.
   * @returns true, если действие удалось.
   */
  async function run(
    action: () => Promise<unknown>,
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
    bastions,
    sharedBastions,
    freeBastions,
    limit,
    subscriberLimit,
    canCreate,
    status,
    /** Причина, по которой список не загрузился, — текстом для пользователя. */
    errorMessage: computed(() =>
      getBastionErrorMessage(loadError.value, MY_BASTIONS_LABELS.loadError),
    ),
    refresh,
    isSaving,
    create: (request: CreatePlayerBastionRequest) =>
      run(() => createPlayerBastion(request), BASTION_GAME_LABELS.created),
    update: (id: string, request: UpdatePlayerBastionRequest) =>
      run(() => updatePlayerBastion(id, request), BASTION_GAME_LABELS.updated),
    remove: (id: string) =>
      run(() => deletePlayerBastion(id), MY_BASTIONS_LABELS.removed),
    joinGame: (id: string, gameId: string) =>
      run(() => joinGameWithBastion(id, gameId), BASTION_GAME_LABELS.added),
    leaveGame: (id: string) =>
      run(() => leaveGameWithBastion(id), BASTION_GAME_LABELS.leftGame),
  };
}
