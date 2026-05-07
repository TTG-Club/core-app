import type { PasswordChangeForm } from '../model';

import { FetchError } from 'ofetch';

import {
  PASSWORD_CHANGE_API_PATH,
  PASSWORD_CHANGE_ERROR_TOAST_COLOR,
  PASSWORD_CHANGE_ERROR_TOAST_DESCRIPTION,
  PASSWORD_CHANGE_ERROR_TOAST_TITLE,
  PASSWORD_CHANGE_SUCCESS_TOAST_COLOR,
  PASSWORD_CHANGE_SUCCESS_TOAST_DESCRIPTION,
  PASSWORD_CHANGE_SUCCESS_TOAST_TITLE,
} from '../model';

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Возвращает тело запроса смены пароля без клиентского подтверждения.
 */
function toPasswordChangeRequest(
  form: PasswordChangeForm,
): PasswordChangeRequest {
  return {
    currentPassword: form.currentPassword,
    newPassword: form.newPassword,
  };
}

export function useSecurity() {
  const toast = useToast();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function updateEmail(_email: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать API запрос
    // await $fetch('/api/user/email', { method: 'PATCH', body: { email: _email } });

    toast.add({
      title: 'Email обновлён',
      description: 'На новый адрес отправлено письмо для подтверждения',
      color: 'success',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  async function changePassword(form: PasswordChangeForm): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      await $fetch(PASSWORD_CHANGE_API_PATH, {
        body: toPasswordChangeRequest(form),
        method: 'POST',
      });

      toast.add({
        title: PASSWORD_CHANGE_SUCCESS_TOAST_TITLE,
        description: PASSWORD_CHANGE_SUCCESS_TOAST_DESCRIPTION,
        color: PASSWORD_CHANGE_SUCCESS_TOAST_COLOR,
      });

      return true;
    } catch (changePasswordError) {
      error.value = PASSWORD_CHANGE_ERROR_TOAST_DESCRIPTION;

      if (changePasswordError instanceof FetchError) {
        error.value =
          changePasswordError.data?.message || changePasswordError.message;
      }

      toast.add({
        title: PASSWORD_CHANGE_ERROR_TOAST_TITLE,
        description: error.value ?? PASSWORD_CHANGE_ERROR_TOAST_DESCRIPTION,
        color: PASSWORD_CHANGE_ERROR_TOAST_COLOR,
      });

      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return { updateEmail, changePassword, isLoading, error };
}
