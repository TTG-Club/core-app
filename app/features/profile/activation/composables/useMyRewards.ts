import type { RewardPerk, UserReward } from '../model';

import {
  REWARDS_MY_API_PATH,
  SUBSCRIPTION_MY_REWARDS_DATA_KEY,
} from '../model';

/**
 * Перки (постоянные награды) текущего пользователя (GET /api/rewards/me).
 * server: false — приватные данные грузим на клиенте, где авторизация
 * (cookie → Bearer → subscriber) гарантированно работает.
 */
export function useMyRewards() {
  const requestFetch = useRequestFetch();

  // retry: 0 — фоновый опрос не должен удваиваться авто-ретраем ofetch (в т.ч. на
  // 429), иначе при rate-limit мы сами усиливаем нагрузку. См. useSubscriptionAutoRefresh.
  const { data, status, error, refresh } = useAsyncData<UserReward[]>(
    SUBSCRIPTION_MY_REWARDS_DATA_KEY,
    () => requestFetch(REWARDS_MY_API_PATH, { retry: 0 }),
    { default: () => [], server: false },
  );

  const perks = computed(
    () => new Set((data.value ?? []).map((reward) => reward.perk)),
  );

  /** Есть ли у пользователя указанный перк. */
  function hasPerk(perk: RewardPerk): boolean {
    return perks.value.has(perk);
  }

  const isLoading = computed(() => status.value === 'pending');

  return { rewards: data, perks, hasPerk, status, isLoading, error, refresh };
}
