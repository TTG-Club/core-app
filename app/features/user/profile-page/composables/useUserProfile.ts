import type { PasswordChangeForm } from '../model';

/**
 * Composable для управления профилем пользователя
 *
 * Предоставляет методы для обновления данных профиля,
 * смены пароля и email с обработкой состояний загрузки и ошибок
 */
export function useUserProfile() {
  const toast = useToast();

  /**
   * Состояние загрузки
   */
  const isLoading = ref(false);

  /**
   * Текст ошибки
   */
  const error = ref<string | null>(null);

  /**
   * Обновление отображаемого имени
   *
   * @param _name - Новое отображаемое имя
   */
  function updateDisplayName(_name: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать API запрос
    // await $fetch('/api/user/profile', {
    //   method: 'PATCH',
    //   body: { displayName: name },
    // });

    toast.add({
      title: 'Имя обновлено',
      description: 'Ваше отображаемое имя успешно изменено',
      color: 'success',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  /**
   * Обновление email адреса
   *
   * @param _email - Новый email адрес
   */
  function updateEmail(_email: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать API запрос
    // await $fetch('/api/user/email', {
    //   method: 'PATCH',
    //   body: { email },
    // });

    toast.add({
      title: 'Email обновлён',
      description: 'На новый адрес отправлено письмо для подтверждения',
      color: 'success',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  /**
   * Смена пароля
   *
   * @param _data - Данные формы смены пароля
   */
  function changePassword(_data: PasswordChangeForm): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать API запрос
    // await $fetch('/api/user/password', {
    //   method: 'PATCH',
    //   body: {
    //     currentPassword: data.currentPassword,
    //     newPassword: data.newPassword,
    //   },
    // });

    toast.add({
      title: 'Пароль изменён',
      description: 'Ваш пароль успешно обновлён',
      color: 'success',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  /**
   * Обновление видимости статистики
   *
   * @param _key - Ключ статистики
   * @param _isPublic - Публичная или приватная
   */
  function updateStatisticVisibility(
    _key: string,
    _isPublic: boolean,
  ): Promise<boolean> {
    // TODO: Реализовать API запрос
    // await $fetch('/api/user/statistics', {
    //   method: 'PATCH',
    //   body: { key, isPublic },
    // });

    return Promise.resolve(true);
  }

  /**
   * Подключение социальной сети
   *
   * @param _socialId - ID социальной сети
   */
  function connectSocial(_socialId: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать OAuth flow
    // const authUrl = await $fetch(`/api/auth/connect/${socialId}`);
    // window.location.href = authUrl;

    toast.add({
      title: 'Подключение',
      description: 'Перенаправление на страницу авторизации...',
      color: 'info',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  /**
   * Отключение социальной сети
   *
   * @param _socialId - ID социальной сети
   */
  function disconnectSocial(_socialId: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать API запрос
    // await $fetch(`/api/auth/disconnect/${socialId}`, {
    //   method: 'DELETE',
    // });

    toast.add({
      title: 'Отключено',
      description: 'Аккаунт успешно отключён',
      color: 'success',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    updateDisplayName,
    updateEmail,
    changePassword,
    updateStatisticVisibility,
    connectSocial,
    disconnectSocial,
  };
}
