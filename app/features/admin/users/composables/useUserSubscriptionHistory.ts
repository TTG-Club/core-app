import { FetchError } from 'ofetch';

import {
  ADMIN_SUBSCRIPTION_HISTORY_TEXT,
  adminSubscriptionHistoryKey,
  adminSubscriptionHistoryPath,
  adminSubscriptionHistorySchema,
} from '../model';

/**
 * История подписки пользователя для админ-карточки: оплаты, выдачи и
 * отключения администратором, промокоды — с датой окончания до и после.
 * Грузится в браузере (авторизация cookie → Bearer → subscriber), ответ
 * проверяется схемой. Блок подписки обновляет её по ключу после своих действий.
 *
 * @param username Логин пользователя, чью историю показываем.
 */
export function useUserSubscriptionHistory(username: MaybeRefOrGetter<string>) {
  const requestFetch = useRequestFetch();
  const toast = useToast();

  const { data, status } = useAsyncData(
    () => adminSubscriptionHistoryKey(toValue(username)),
    async () => {
      try {
        return adminSubscriptionHistorySchema.parse(
          await requestFetch<unknown>(
            adminSubscriptionHistoryPath(toValue(username)),
          ),
        );
      } catch (error) {
        let description: string = ADMIN_SUBSCRIPTION_HISTORY_TEXT.loadError;

        if (error instanceof FetchError) {
          description = error.data?.message || error.message;
        }

        toast.add({
          title: ADMIN_SUBSCRIPTION_HISTORY_TEXT.errorTitle,
          description,
          color: 'error',
        });

        return [];
      }
    },
    { server: false, default: () => [] },
  );

  const isLoading = computed(() => status.value === 'pending');

  return {
    events: data,
    isLoading,
  };
}
