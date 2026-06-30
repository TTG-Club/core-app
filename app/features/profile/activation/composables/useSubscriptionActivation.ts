import type { Subscription } from '../model';

import { FetchError } from 'ofetch';

import { subscriptionActivatePath } from '../model';

/**
 * Активация подписки (POST /api/subscriptions/{id}/activate): запускает таймер
 * REGISTERED→ACTIVE. Возвращает обновлённую подписку. Роль не выдаётся — доступ
 * считается по статусу подписки в реальном времени (на стороне subscriber-service).
 */
export function useSubscriptionActivation() {
  const toast = useToast();

  // id подписки, по которой сейчас идёт активация (для построчного лоадера).
  const activatingId = ref<string | null>(null);

  async function activate(id: string): Promise<Subscription | null> {
    activatingId.value = id;

    try {
      const updated = await $fetch<Subscription>(subscriptionActivatePath(id), {
        method: 'POST',
      });

      toast.add({
        title: 'Подписка активирована',
        color: 'success',
      });

      return updated;
    } catch (error) {
      let description = 'Не удалось активировать подписку';

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
      activatingId.value = null;
    }
  }

  return { activatingId, activate };
}
