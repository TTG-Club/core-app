import type { AdminSubscriptionResponse } from '../model';

import { FetchError } from 'ofetch';

import { adminSubscriptionGrantPath, adminSubscriptionPath } from '../model';

/**
 * Управление подпиской пользователя в админ-карточке: загрузка статуса,
 * выдача N месяцев и отзыв подписки. Работает через server-прокси на
 * subscriber-service (admin API). Статус грузится лениво — только когда блок открыт.
 *
 * @param username Имя пользователя, чьей подпиской управляем.
 */
export function useUserSubscription(username: MaybeRefOrGetter<string>) {
  const requestFetch = useRequestFetch();
  const toast = useToast();

  const subscription = ref<AdminSubscriptionResponse | null>(null);
  const isLoading = ref(false);
  const isGranting = ref(false);
  const isRevoking = ref(false);

  /**
   * Загружает текущий статус подписки пользователя.
   */
  async function load(): Promise<void> {
    isLoading.value = true;

    try {
      subscription.value = await requestFetch<AdminSubscriptionResponse>(
        adminSubscriptionPath(toValue(username)),
      );
    } catch (error) {
      let description = 'Не удалось загрузить статус подписки';

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({ title: 'Ошибка', description, color: 'error' });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Выдаёт пользователю подписку на указанное число месяцев и обновляет статус.
   */
  async function grant(months: number): Promise<boolean> {
    isGranting.value = true;

    try {
      subscription.value = await requestFetch<AdminSubscriptionResponse>(
        adminSubscriptionGrantPath(toValue(username)),
        { method: 'PUT', body: { months } },
      );

      toast.add({ title: 'Подписка выдана', color: 'success' });

      return true;
    } catch (error) {
      let description = 'Не удалось выдать подписку';

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({ title: 'Ошибка', description, color: 'error' });

      return false;
    } finally {
      isGranting.value = false;
    }
  }

  /**
   * Отзывает (отключает) подписку пользователя и обновляет статус.
   */
  async function revoke(): Promise<boolean> {
    isRevoking.value = true;

    try {
      subscription.value = await requestFetch<AdminSubscriptionResponse>(
        adminSubscriptionPath(toValue(username)),
        { method: 'DELETE' },
      );

      toast.add({ title: 'Подписка отключена', color: 'success' });

      return true;
    } catch (error) {
      let description = 'Не удалось отключить подписку';

      if (error instanceof FetchError) {
        description = error.data?.message || error.message;
      }

      toast.add({ title: 'Ошибка', description, color: 'error' });

      return false;
    } finally {
      isRevoking.value = false;
    }
  }

  return {
    subscription,
    isLoading,
    isGranting,
    isRevoking,
    load,
    grant,
    revoke,
  };
}
