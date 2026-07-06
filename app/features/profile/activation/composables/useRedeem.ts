import type { RedeemResult } from '../model';

import { FetchError } from 'ofetch';

import { SUBSCRIPTION_REDEEM_API_PATH } from '../model';

/**
 * Погашение промокода (POST /api/subscriptions/redeem): выдаёт награды и
 * регистрирует подписку. Возвращает RedeemResult (что выдано) или null при ошибке.
 */
export function useRedeem() {
  const toast = useToast();

  const isRedeeming = ref(false);

  async function redeem(code: string): Promise<RedeemResult | null> {
    const trimmed = code.trim();

    if (!trimmed) {
      toast.add({ title: 'Введите код', color: 'warning' });

      return null;
    }

    isRedeeming.value = true;

    try {
      const result = await $fetch<RedeemResult>(SUBSCRIPTION_REDEEM_API_PATH, {
        method: 'POST',
        body: { code: trimmed },
      });

      toast.add({
        title: 'Код активирован',
        color: 'success',
      });

      return result;
    } catch (error) {
      let description = 'Не удалось активировать код';

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({
        title: 'Ошибка активации',
        description,
        color: 'error',
      });

      return null;
    } finally {
      isRedeeming.value = false;
    }
  }

  return { isRedeeming, redeem };
}
