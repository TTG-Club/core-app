import { FetchError } from 'ofetch';

import {
  DISPLAY_NAME_API_PATH,
  DISPLAY_NAME_ERROR_TOAST_COLOR,
  DISPLAY_NAME_ERROR_TOAST_DESCRIPTION,
  DISPLAY_NAME_ERROR_TOAST_TITLE,
  DISPLAY_NAME_SUCCESS_TOAST_COLOR,
  DISPLAY_NAME_SUCCESS_TOAST_DESCRIPTION,
  DISPLAY_NAME_SUCCESS_TOAST_TITLE,
} from '../model';

/**
 * Смена отображаемого имени. После успеха перезапрашивает профиль (`useUser`),
 * чтобы новое имя сразу подхватилось везде, где оно рендерится.
 */
export function useDisplayName() {
  const toast = useToast();
  const { fetch: refreshUser } = useUser();
  const { syncCommentsName } = useCommentsNameSync();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function changeDisplayName(displayName: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      await $fetch(DISPLAY_NAME_API_PATH, {
        body: { displayName },
        method: 'PATCH',
      });

      await refreshUser();

      // Прокидываем новое имя в старые комментарии пользователя (best-effort).
      syncCommentsName();

      toast.add({
        title: DISPLAY_NAME_SUCCESS_TOAST_TITLE,
        description: DISPLAY_NAME_SUCCESS_TOAST_DESCRIPTION,
        color: DISPLAY_NAME_SUCCESS_TOAST_COLOR,
      });

      return true;
    } catch (changeError) {
      error.value = DISPLAY_NAME_ERROR_TOAST_DESCRIPTION;

      if (changeError instanceof FetchError) {
        error.value = changeError.data?.message || changeError.message;
      }

      toast.add({
        title: DISPLAY_NAME_ERROR_TOAST_TITLE,
        description: error.value ?? DISPLAY_NAME_ERROR_TOAST_DESCRIPTION,
        color: DISPLAY_NAME_ERROR_TOAST_COLOR,
      });

      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return { changeDisplayName, isLoading, error };
}
