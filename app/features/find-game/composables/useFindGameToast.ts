import {
  VTTG_SUBSCRIPTION_LIMIT_ACTION,
  VTTG_SUBSCRIPTION_LINK,
} from '~vttg/model';

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
    const description =
      typeof reason === 'string' ? reason : getFindGameErrorMessage(reason);

    toast.add({
      title,
      // Без внятной причины описание совпадает с заголовком — дважды один
      // текст не показываем.
      description: description === title ? undefined : description,
      color: 'error',
      icon: FIND_GAME_TOAST_ERROR_ICON,
    });
  }

  /**
   * Показывает отказ по бесплатному лимиту: к причине добавляется, что даст
   * подписка, и кнопка, ведущая к её оформлению.
   *
   * @param reason Ошибка запроса.
   * @param title Заголовок отказа.
   * @param subscriptionHint Что меняет подписка в этом лимите.
   */
  function showSubscriptionLimit(
    reason: unknown,
    title: string,
    subscriptionHint: string,
  ): void {
    toast.add({
      title,
      description: `${getFindGameErrorMessage(reason)}. ${subscriptionHint}`,
      color: 'warning',
      icon: VTTG_SUBSCRIPTION_LINK.icon,
      actions: [VTTG_SUBSCRIPTION_LIMIT_ACTION],
    });
  }

  return { showError, showSubscriptionLimit, showSuccess };
}
