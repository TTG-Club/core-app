import type { PasswordChangeForm } from '../model/types';

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

  function changePassword(_data: PasswordChangeForm): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать API запрос
    // await $fetch('/api/user/password', { method: 'PATCH', body: _data });

    toast.add({
      title: 'Пароль изменён',
      description: 'Ваш пароль успешно обновлён',
      color: 'success',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  return { updateEmail, changePassword, isLoading, error };
}
