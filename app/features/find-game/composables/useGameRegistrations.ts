import type { MaybeRefOrGetter } from 'vue';

import type { RegistrationDecision } from '../model';

import { fetchGameRegistrations, reviewGameRegistration } from '../model';

/**
 * Заявки в игру глазами мастера: разбор очереди и заполненность состава.
 *
 * Игра приходит одним значением, а не парой «игра + разрешено»: эти два
 * условия менялись разными тактами, и запрос успевал уйти с ещё закрытой
 * панелью, возвращая пустой список, а второе изменение повторного запроса уже
 * не вызывало — заявки не показывались вовсе.
 *
 * @param gameId Игра, чьи заявки нужны; `null` — не запрашивать.
 */
export function useGameRegistrations(gameId: MaybeRefOrGetter<string | null>) {
  const currentGameId = computed(() => toValue(gameId));

  const {
    data: registrations,
    error,
    status,
    refresh,
  } = useAsyncData(
    () => `find-game-registrations-${currentGameId.value ?? 'none'}`,
    async () => {
      const game = currentGameId.value;

      if (!game) {
        return [];
      }

      return await fetchGameRegistrations(game);
    },
    {
      watch: [currentGameId],
      deep: false,
      server: false,
      default: () => [],
    },
  );

  const pendingRegistrations = computed(() =>
    (registrations.value ?? []).filter(
      (registration) => registration.status === 'PENDING',
    ),
  );

  const approvedRegistrations = computed(() =>
    (registrations.value ?? []).filter(
      (registration) => registration.status === 'APPROVED',
    ),
  );

  const rejectedRegistrations = computed(() =>
    (registrations.value ?? []).filter(
      (registration) => registration.status === 'REJECTED',
    ),
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Принимает или отклоняет заявку.
   * @param registrationId Идентификатор заявки.
   * @param decision Решение мастера.
   * @param reason Причина отказа; при принятии не передаётся.
   */
  async function review(
    registrationId: string,
    decision: RegistrationDecision,
    reason?: string,
  ): Promise<void> {
    const game = currentGameId.value;

    if (!game) {
      return;
    }

    await reviewGameRegistration(game, registrationId, decision, reason);

    await refresh();
  }

  return {
    registrations: computed(() => registrations.value ?? []),
    approvedRegistrations,
    pendingRegistrations,
    rejectedRegistrations,

    error,
    isLoading,
    status,

    refresh,
    review,
  };
}
