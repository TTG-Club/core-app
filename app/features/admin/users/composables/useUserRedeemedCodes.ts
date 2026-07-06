import type { RedemptionCodeResponse } from '~admin/subscriptions/model';

import { FetchError } from 'ofetch';

import { adminSubscriptionCodesPath } from '../model';

/**
 * Коды, которые пользователь уже активировал, для админ-детали.
 *
 * Тянет адресную ручку `GET /api/admin/subscriptions/{username}/codes`
 * (subscriber-service фильтрует по `redeemedBy` и сортирует новые сверху).
 * Грузится лениво — при монтировании блока (клиентский контекст, где
 * авторизация cookie → Bearer → subscriber гарантированно работает).
 * Ошибку сигналим тостом (как useUserSubscription), отдельного isError нет.
 *
 * @param username Логин пользователя, чьи активации ищем.
 */
export function useUserRedeemedCodes(username: MaybeRefOrGetter<string>) {
  const requestFetch = useRequestFetch();
  const toast = useToast();

  const codes = ref<RedemptionCodeResponse[]>([]);
  const isLoading = ref(false);

  /**
   * Загружает коды, погашённые пользователем.
   */
  async function load(): Promise<void> {
    isLoading.value = true;

    try {
      codes.value = await requestFetch<RedemptionCodeResponse[]>(
        adminSubscriptionCodesPath(toValue(username)),
      );
    } catch (error) {
      let description = 'Не удалось загрузить активированные коды';

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({ title: 'Ошибка', description, color: 'error' });
    } finally {
      isLoading.value = false;
    }
  }

  return {
    codes,
    isLoading,
    load,
  };
}
