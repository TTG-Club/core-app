import type { CreateCodesRequest, RedemptionCodeResponse } from '../model';

import { FetchError } from 'ofetch';

import {
  SUBSCRIPTION_CODES_API_PATH,
  subscriptionCodeDeactivatePath,
  subscriptionCodeReactivatePath,
} from '../model';

/**
 * Мутации над промо-кодами: выпуск пачки и обратимая деактивация.
 * Список кодов грузится на странице через useAsyncData (GET тот же эндпоинт),
 * поэтому здесь только действия + индикаторы загрузки и тосты.
 */
export function useSubscriptionCodes() {
  const toast = useToast();

  const isCreating = ref(false);
  // id кода, по которому сейчас идёт деактивация/активация (для построчного лоадера).
  const updatingId = ref<string | null>(null);

  async function createCodes(
    payload: CreateCodesRequest,
  ): Promise<RedemptionCodeResponse[] | null> {
    isCreating.value = true;

    try {
      const created = await $fetch<RedemptionCodeResponse[]>(
        SUBSCRIPTION_CODES_API_PATH,
        {
          method: 'POST',
          body: payload,
        },
      );

      toast.add({
        title: 'Коды выпущены',
        description: `Создано кодов: ${created.length}`,
        color: 'success',
      });

      return created;
    } catch (error) {
      let description = 'Не удалось выпустить коды';

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({
        title: 'Ошибка выпуска кодов',
        description,
        color: 'error',
      });

      return null;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Деактивирует код (disabled=true) или возвращает его в активные (disabled=false).
   * Возвращает обновлённый код для точечного обновления строки или null при ошибке.
   */
  async function setCodeDisabled(
    id: string,
    disabled: boolean,
  ): Promise<RedemptionCodeResponse | null> {
    updatingId.value = id;

    try {
      const updated = await $fetch<RedemptionCodeResponse>(
        disabled
          ? subscriptionCodeDeactivatePath(id)
          : subscriptionCodeReactivatePath(id),
        { method: 'POST' },
      );

      toast.add({
        title: disabled ? 'Код деактивирован' : 'Код активирован',
        color: 'success',
      });

      return updated;
    } catch (error) {
      let description = disabled
        ? 'Не удалось деактивировать код'
        : 'Не удалось активировать код';

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({
        title: 'Ошибка',
        description,
        color: 'error',
      });

      return null;
    } finally {
      updatingId.value = null;
    }
  }

  return {
    isCreating,
    createCodes,
    updatingId,
    setCodeDisabled,
  };
}
