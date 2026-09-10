import {
  FIND_GAME_TOAST_ERROR_ICON,
  FIND_GAME_TOAST_SUCCESS_ICON,
  FIND_GAME_UNKNOWN_ERROR_MESSAGE,
  getFindGameErrorMessage,
} from '../model';

/**
 * Уведомления раздела поиска игр.
 *
 * Успех и отказ выглядят одинаково во всём разделе, а отказ вдобавок всегда
 * разбирается одним и тем же способом: сервис отвечает по RFC 7807, и готовый
 * русский текст лежит в `detail`. Собрано в одном месте, чтобы вид уведомления
 * не расходился от экрана к экрану.
 */
export function useFindGameToast() {
  const toast = useToast();

  /**
   * Показывает успешное действие.
   * @param title Что именно получилось.
   */
  function showSuccess(title: string): void {
    toast.add({
      title,
      color: 'success',
      icon: FIND_GAME_TOAST_SUCCESS_ICON,
    });
  }

  /**
   * Показывает отказ.
   *
   * @param reason Ошибка запроса или готовый текст, если объяснение своё.
   * @param title Заголовок; по умолчанию — общий текст отказа раздела.
   */
  function showError(
    reason: unknown,
    title: string = FIND_GAME_UNKNOWN_ERROR_MESSAGE,
  ): void {
    toast.add({
      title,
      description:
        typeof reason === 'string' ? reason : getFindGameErrorMessage(reason),
      color: 'error',
      icon: FIND_GAME_TOAST_ERROR_ICON,
    });
  }

  return { showError, showSuccess };
}
