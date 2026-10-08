import {
  getVttgModulesErrorMessage,
  VTTG_MODULES_TOAST_ERROR_ICON,
  VTTG_MODULES_TOAST_SUCCESS_ICON,
  VTTG_MODULES_UNKNOWN_ERROR_MESSAGE,
} from '../model';

/**
 * Уведомления раздела модулей VTTG: успех и отказ выглядят одинаково на
 * странице автора и в очереди модерации, а отказ разбирается из
 * `ProblemDetail` реестра.
 */
export function useVttgModulesToast() {
  const toast = useToast();

  /**
   * Показывает успешное действие.
   * @param title Что именно получилось.
   */
  function showSuccess(title: string): void {
    toast.add({
      title,
      color: 'success',
      icon: VTTG_MODULES_TOAST_SUCCESS_ICON,
    });
  }

  /**
   * Показывает отказ с причиной из ответа сервиса.
   * @param error Ошибка запроса.
   */
  function showError(error: unknown): void {
    const description = getVttgModulesErrorMessage(error);

    toast.add({
      title: VTTG_MODULES_UNKNOWN_ERROR_MESSAGE,
      // Без внятной причины описание совпадает с заголовком — дважды один
      // текст не показываем.
      description:
        description === VTTG_MODULES_UNKNOWN_ERROR_MESSAGE
          ? undefined
          : description,
      color: 'error',
      icon: VTTG_MODULES_TOAST_ERROR_ICON,
    });
  }

  return { showError, showSuccess };
}
