import type { PlayerBastion } from '../model';

import { ACTIVITY_LABELS, getBastionErrorMessage } from '../model';

/**
 * Выполняет действие с бастионом (приказ, ход, казна, стройка): показывает
 * уведомление об успехе или ошибку с текстом сервера и отдаёт бастион после
 * действия — родитель подменяет им свой, чтобы следующая правка шла с новой
 * версией.
 *
 * @returns Признак выполнения и запуск действия.
 */
export function useBastionAction() {
  const toast = useToast();
  const isRunning = ref(false);

  /**
   * Запускает действие.
   *
   * @param action Запрос к core-api.
   * @param successTitle Текст уведомления об успехе.
   * @returns Бастион после действия или undefined при ошибке.
   */
  async function run(
    action: () => Promise<PlayerBastion>,
    successTitle: string,
  ): Promise<PlayerBastion | undefined> {
    isRunning.value = true;

    try {
      const bastion = await action();

      toast.add({ title: successTitle, color: 'success' });

      return bastion;
    } catch (error) {
      toast.add({
        title: ACTIVITY_LABELS.actionError,
        description: getBastionErrorMessage(error, ACTIVITY_LABELS.actionError),
        color: 'error',
      });

      return undefined;
    } finally {
      isRunning.value = false;
    }
  }

  return { isRunning, run };
}
