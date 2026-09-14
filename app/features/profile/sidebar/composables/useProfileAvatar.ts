import {
  PROFILE_AVATAR_API_PATH,
  PROFILE_AVATAR_FORM_FIELD,
  PROFILE_AVATAR_LABELS,
} from '../model';

/**
 * Аватарка текущего пользователя: загрузка уже вырезанного квадрата и
 * удаление. Файл сжимает и хранит сервер, ссылку — core-api. После успеха
 * перезапрашивает профиль (`useUser`), и новая аватарка сразу видна в шапке и
 * в профиле. Итог каждой операции сообщается тостом.
 *
 * @returns флаг идущей операции, загрузка и удаление аватарки.
 */
export function useProfileAvatar() {
  const toast = useToast();
  const { fetch: refreshUser } = useUser();

  const isSaving = ref(false);

  /**
   * Отправляет смену аватарки. Пока идёт одна смена, вторая не начинается:
   * сервер удаляет прежний файл после сохранения нового, и две загрузки
   * наперегонки оставили бы в хранилище ничейный файл.
   *
   * @param sendRequest запрос к серверу.
   * @param successTitle заголовок тоста об успехе.
   * @returns true, если аватарка изменена.
   */
  async function changeAvatar(
    sendRequest: () => Promise<unknown>,
    successTitle: string,
  ): Promise<boolean> {
    if (isSaving.value) {
      return false;
    }

    isSaving.value = true;

    try {
      await sendRequest();
      await refreshUser();

      toast.add({ title: successTitle, color: 'success' });

      return true;
    } catch (error) {
      consola.error(error);

      toast.add({
        title: PROFILE_AVATAR_LABELS.error,
        description: getUploadErrorMessage(error),
        color: 'error',
      });

      return false;
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Ставит новую аватарку.
   *
   * @param file квадрат, вырезанный в редакторе кадрирования.
   * @returns true, если аватарка обновлена.
   */
  function uploadAvatar(file: File): Promise<boolean> {
    const avatarForm = new FormData();

    avatarForm.append(PROFILE_AVATAR_FORM_FIELD, file);

    return changeAvatar(
      () =>
        $fetch(PROFILE_AVATAR_API_PATH, { method: 'PUT', body: avatarForm }),
      PROFILE_AVATAR_LABELS.uploaded,
    );
  }

  /**
   * Убирает аватарку: вместо неё снова инициалы.
   *
   * @returns true, если аватарка удалена.
   */
  function removeAvatar(): Promise<boolean> {
    return changeAvatar(
      () => $fetch(PROFILE_AVATAR_API_PATH, { method: 'DELETE' }),
      PROFILE_AVATAR_LABELS.removed,
    );
  }

  return {
    isSaving: readonly(isSaving),
    uploadAvatar,
    removeAvatar,
  };
}
