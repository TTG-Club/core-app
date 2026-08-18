import type { ComputedRef } from 'vue';

import type { MyBugUpdatesResponse } from '../../model';

import { createSharedComposable } from '@vueuse/core';

import {
  BUG_REPORT_MY_UPDATES_API_URL,
  MY_BUGS_POLL_COOLDOWN_MS,
  MY_BUGS_POLL_INTERVAL_MS,
  MY_BUGS_POLL_MAX_BACKOFF_MS,
  MY_BUGS_SEEN_AT_STORAGE_KEY,
  MY_BUGS_SEEN_SETTLE_MS,
  MY_BUGS_UPDATES_DATA_KEY,
} from '../../model';

/** Описание возвращаемого значения композабла useMyBugReportUpdates. */
export interface UseMyBugReportUpdatesReturn {
  /** Есть ли непросмотренные изменения статуса */
  hasUpdates: ComputedRef<boolean>;

  /**
   * Самая свежая дата изменения статуса среди репортов автора. Меняется при
   * каждом действии модератора — служит сигналом «список пора перезагрузить».
   */
  lastStatusUpdatedAt: ComputedRef<string | null>;

  /** Пометить прочитанными все изменения не новее переданной даты */
  markSeenUpTo: (statusUpdatedAt: string | null) => void;
}

/**
 * Индикатор «есть новости по баг-репортам»: точка у вкладки профиля, у шлема и
 * в его меню.
 *
 * Обёрнут в `createSharedComposable`: потребителей несколько (шлем, обе копии
 * навигации профиля, сам раздел), а таймер опроса и наблюдатель за отметкой
 * должны существовать в единственном экземпляре — иначе каждый потребитель
 * заводил бы свой и слал дубли запросов. Состояние живёт, пока смонтирован хотя
 * бы один потребитель, и вместе с последним умирает вместе с таймером.
 *
 * Отметка последнего просмотра хранит строку `lastStatusUpdatedAt`, полученную
 * от сервиса, а не время браузера: сервис отдаёт даты без часового пояса, и
 * собственная метка клиента сравнивалась бы с ними со сдвигом.
 *
 * Сводку опрашиваем фоном (`useBackgroundRefresh`), поэтому точка зажигается
 * без перезагрузки страницы.
 */
function createMyBugReportUpdates(): UseMyBugReportUpdatesReturn {
  const requestFetch = useRequestFetch();

  const seenAt = useLocalStorage(MY_BUGS_SEEN_AT_STORAGE_KEY, '');

  // server: false — приватные данные пользователя грузим на клиенте, где
  // авторизация (cookie → Bearer → микросервис) гарантированно работает.
  // retry: 0 — фоновый опрос не должен удваиваться авто-ретраем ofetch.
  const { data, error, refresh } = useAsyncData<MyBugUpdatesResponse>(
    MY_BUGS_UPDATES_DATA_KEY,
    () =>
      requestFetch(BUG_REPORT_MY_UPDATES_API_URL, {
        query: { since: seenAt.value || undefined },
        retry: 0,
      }),
    { server: false },
  );

  // Наружу отдаём только факт: интерфейс показывает точку, а не число.
  const hasUpdates = computed(() => (data.value?.count ?? 0) > 0);

  const lastStatusUpdatedAt = computed(
    () => data.value?.lastStatusUpdatedAt ?? null,
  );

  /**
   * Двигает отметку просмотра вперёд и пересчитывает сводку.
   *
   * Отметка только растёт: карточки читаются по одной, и откат назад заново
   * зажёг бы точки на уже прочитанном.
   *
   * @param statusUpdatedAt Дата изменения прочитанного репорта.
   */
  function markSeenUpTo(statusUpdatedAt: string | null): void {
    if (!statusUpdatedAt) {
      return;
    }

    if (
      seenAt.value
      && new Date(seenAt.value).getTime() >= new Date(statusUpdatedAt).getTime()
    ) {
      return;
    }

    seenAt.value = statusUpdatedAt;
  }

  // Сводку пересчитываем, когда отметка устоится: карточки читаются пачкой, и
  // запрос на каждую превращался бы в залп, где побеждает случайный ответ —
  // точки гасли не полностью. Один запрос с итоговой отметкой этого лишён.
  watchDebounced(
    seenAt,
    () => {
      void refresh();
    },
    { debounce: MY_BUGS_SEEN_SETTLE_MS },
  );

  // Опрос сводки: точка зажигается без перезагрузки страницы.
  useBackgroundRefresh({
    refresh: () => refresh(),
    shouldBackoff: () => !!error.value,
    intervalMs: MY_BUGS_POLL_INTERVAL_MS,
    cooldownMs: MY_BUGS_POLL_COOLDOWN_MS,
    maxBackoffMs: MY_BUGS_POLL_MAX_BACKOFF_MS,
  });

  return {
    hasUpdates,
    lastStatusUpdatedAt,
    markSeenUpTo,
  };
}

export const useMyBugReportUpdates = createSharedComposable(
  createMyBugReportUpdates,
);
