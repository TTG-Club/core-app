/**
 * Опции для модального окна подтверждения
 */
interface ConfirmModalOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: 'primary' | 'error' | 'warning';
}

/**
 * Composable для модальных окон подтверждения
 *
 * Предоставляет метод для показа модального окна с подтверждением действия
 */
export function useConfirmModal() {
  /**
   * Показать модальное окно подтверждения
   *
   * @param options - Опции модального окна
   * @returns Promise с результатом (true - подтверждено, false - отменено)
   */
  function confirm(options: ConfirmModalOptions): Promise<boolean> {
    // Временное решение: используем нативный confirm, пока разбираемся с useModal
    if (typeof window !== 'undefined') {
      return Promise.resolve(
        // eslint-disable-next-line no-alert
        window.confirm(`${options.title}\n\n${options.description}`),
      );
    }

    return Promise.resolve(false);
  }

  return {
    confirm,
  };
}
